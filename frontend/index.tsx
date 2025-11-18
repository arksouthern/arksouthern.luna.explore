import { createMutable } from "solid-js/store"
import { batch, For, onMount, Show } from "solid-js"
import A from "@arksouthern/jsx/ax"
import HandleSet from "@arksouthern/jsx/hx"
import Variables from "@arksouthern/jsx/vx"
import { createApi } from "~/lib/url"
import { App } from "~/Types"
import { XpWindow } from "~/components/luna/window"
import { XpTitleButtons, XpTitleButtonsClose, XpTitleButtonsNormal } from "~/components/luna/title-buttons"
import MatchAs from "@arksouthern/jsx/mx"
import { store } from "~/Store"
import { api, FioStat, SaveLocation } from "../backend"
import { clipboardFsCopy, clipboardFsPaste, closeAppWindow, kbdShortcutOn, openApp, queryFileOpener } from "~/lib/luna"
import { XpDropDownItem, XpDropDownMenu, XpDropDownTrigger } from "~/components/luna/dropdown-menu.tsx"
import { XpBarMenu, XpBarMenuCheckboxItem, XpBarMenuDivider, XpBarMenuItem, XpBarMenuLineItem, XpBarMenuMasterItem } from "~/components/luna/bar-menu"
import { createAbout } from "~/components/luna/about"
import { XpAsideAccordion, XpAsideAccordionItem } from "~/components/luna/side-accordian"
import { createFiosView, SortMx } from "~/components/luna/file-list-table-view-fios"

const API = createApi<typeof api>("@arksouthern/luna.explore")

type ViewSidebarMx = { as: "prompts" } | { as: "tree" } | { as: "favorites" } | { as: "none" }

export default function ProgFileExplorer(props: App) {

	const pathFirstLoad = () => {
		if (!props.app.params.openPath) return ""
		if (props.app.params.openPath.endsWith("/")) return props.app.params.openPath
		return `${props.app.params.openPath}/`
	}

	const [storeSelf, XpFileFiosView] = createFiosView({ pathFirstLoad, updateDirThenCurrentFiles })

	const self = createMutable({
		isViewStatusBar: true,
		isViewAddressBar: true,
		isViewButtonsBar: true,

		networkFavoritesFiles: [] as FioStat[],
		networkTreeDir: [] as Awaited<ReturnType<typeof API['dirList']>>,

		viewSidebarMx: { as: "prompts" } as ViewSidebarMx,
	})

	async function updateDirThenCurrentFiles(props: { dir: string }) {
		const items = await API.folderRead(props)
		batch(() => {
			storeSelf.selectedItems.splice(0)
			storeSelf.dir = props.dir
			storeSelf.networkDirCurrentFiles = items
		})
	}

	onMount(async () => {
		if (storeSelf.dir) {
			updateDirThenCurrentFiles({ dir: storeSelf.dir })
			self.networkTreeDir = await API.dirList({ path: storeSelf.dir })
		} else {
			self.networkTreeDir = await API.dirList({ path: "/" })
		}
		self.networkFavoritesFiles = await API.dirList({ path: "../data/Favorites/ignore" })
	})

	function newPath(props: { path: string }) {
		return props.path.replaceAll("\\", "/")
	}

	function DirTree(props: { dirTree: Awaited<ReturnType<typeof API['dirList']>>, path: string }) {
		return (
			<>
				<ul class="text-[.62rem] flex-1 relative px-1 flex flex-col pl-[.8rem]">
					{/* <button class="absolute top-0.5 left-[17px] z-20 bg-[#f3f4f6] border-[#61646d] border w-3 h-3 scale-75"><span class="block -translate-y-1.5 ml-[1px]  text-sm">+</span></button> */}
					<For each={props.dirTree.filter(x => x.type.as == 'folder')}>{
						x => (
							<>
								<li
									class="text-nowrap relative flex gap-1 items-center"
								>
									<span onClick={async () => {
										if (x.type.as != 'folder') return
										if (x.type.fios.length)
											x.type.fios = []
										else
											x.type.fios = await API.dirList({ path: `${props.path.split("/").slice(0, -1).join("/")}/${x.name}/ignore` })
									}}>
										<button class="absolute font-normal bg-[linear-gradient(135deg,#FFFFFF,#C1BAAC)] rounded-[1px] top-0.5 -left-[1rem] z-20 bg-[#f3f4f6] border-[#7F97B2] border w-2.5 h-2.5 scale-75">
											{x.type.as == 'folder' && x.type.fios.length
												?
												<span class="block leading-[1.2rem] -translate-y-1.5 ml-[0.5px]  text-[.62rem]">-</span>
												:
												<span class="block leading-[1.2rem] -translate-y-1.5 ml-[0.5px]  text-[.62rem]">+</span>
											}
										</button>

										{x.type.as == 'folder' && x.type.fios.length
											?
											<img class="h-4 w-4 min-w-4" src="/src/assets/shell32/5.ico" />
											:
											<img class="h-4 w-4 min-w-4" src="/src/assets/shell32/4.ico" />
										}
									</span>
									<span
										class="hover:text-[#00007B] hover:underline"
										onClick={async () => {
											if (x.type.as != 'folder') return
											if (x.type.fios.length) {
												x.type.fios = []
											}
											else {
												x.type.fios = await API.dirList({ path: `${props.path.split("/").slice(0, -1).join("/")}/${x.name}/ignore` })
												const dir = `${props.path.split("/").slice(0, -1).join("/")}/${x.name}`
												updateDirThenCurrentFiles({ dir })
											}
										}}>
										{x.name}
									</span>
								</li>
								{x.type.as == 'folder' && x.type.fios.length &&
									<A.SubTree>
										{x.type.as == 'folder' &&
											<DirTree dirTree={x.type.fios} path={`${newPath(props).split("/").slice(0, -1).join("/")}/${x.name}/ignore`} />
										}
									</A.SubTree>
								}
							</>
						)
					}</For>
				</ul>
			</>
		)
	}

	const [About, setAbout] = createAbout({ app: props.app, offsetX: 4, offsetY: 2, sizeX: 30, sizeY: 18 })

	return (
		<A.FileExplorer>
			<About progId="@arksouthern/luna.explore" license={{ as: "full", title: "MIT" }} icon={""} title={
				<>
					<A.TitleText class="flex-1 pointer-events-none pr-1 tracking-[.032rem] overflow-hidden whitespace-nowrap text-ellipsis">
						About Explorer
					</A.TitleText>
					<XpTitleButtons>
						<XpTitleButtonsClose {...props} onClick={() => setAbout.dialogHide()} />
					</XpTitleButtons>
				</>
			}>
				Replicating Microsoft's <small class="text-[0.75em]">&#174;</small> Explorer <br />
				Version 0.4.3 (Build 2025.03-06) <br />
				Arkansas Soft Construction, Inc. <br />
				<br />
			</About>
			<HandleSet
				handlers={{
					itemsCopy: async () => {
						const openPathList = storeSelf.selectedItems.map(id => `${storeSelf.dir}${storeSelf.networkDirCurrentFiles[id].name}`)
						await clipboardFsCopy({ openPathList })
					},
					itemsPaste: async () => {
						const result = await clipboardFsPaste({})
						if (result.as == "pasteFailed") return
						await Promise.all(
							result.openPathList.map(async (originalPath) => {
								await API.anyCopy({ originalPath, destPath: `${storeSelf.dir}${originalPath.split("/").pop()}` })
							})
						)
						updateDirThenCurrentFiles({ dir: storeSelf.dir })
					},
					favClick: (fav: FioStat) => async () => {
						storeSelf.selectedItems.splice(0)

						if (fav.type.as != "shortcut") return
						const { prog, params } = fav.type.shortcut
						if (prog == "@arksouthern/luna.explore")
							updateDirThenCurrentFiles({ dir: params.openPath })
						else
							openApp({ params, program: prog })
					},
					navDirUp: async () => {
						let dir = storeSelf.dir.split("/") as any
						dir = dir.slice(0, -2)
						dir = dir.join("/") + "/"
						updateDirThenCurrentFiles({ dir })
					},
					sortsFileListToggle: (as: SortMx['as']) => () => {
						const sIndex = storeSelf.sorts.findIndex((s) => s.as == as)
						const sort = storeSelf.sorts[sIndex]
						if (!sort) storeSelf.sorts.push({ as, direction: "up" })
						else if (sort.direction == "up") sort.direction = "down"
						else storeSelf.sorts.splice(sIndex, 1)
					},
					appClose: async () => {
						closeAppWindow(props)
					},
					displaySidebar: (as: ViewSidebarMx['as']) => () => {
						self.viewSidebarMx = self.viewSidebarMx.as == as
							? { as: "prompts" }
							: { as }
					},
					displayStandardButtonsToggle: () => {
						self.isViewButtonsBar = !self.isViewButtonsBar
					},
					displayAddressBarToggle: () => {
						self.isViewAddressBar = !self.isViewAddressBar
					},
					displayStatusBarToggle: () => {
						self.isViewStatusBar = !self.isViewStatusBar
					},
					anySelect: (props: { file: FioStat, index: number }) => (e: any) => {
						if (!(e.ctrlKey || e.metaKey)) storeSelf.selectedItems.splice(0)
						if (storeSelf.selectedItems.includes(props.index)) {
							const j = store.selectedItems.findIndex((j) => j == props.index)
							storeSelf.selectedItems.splice(j, 1)
						} else {
							storeSelf.selectedItems.push(props.index)
						}
						console.log(storeSelf.selectedItems)
					},
					anySelectAll: () => {
						storeSelf.selectedItems = storeSelf.networkDirCurrentFiles.map((_, i) => i)
					},
					anySelectInvert: () => {
						storeSelf.selectedItems = storeSelf.networkDirCurrentFiles.map((_, i) => storeSelf.selectedItems.includes(i) ? -1 : i).filter(i => i > -1)
					},
					openSearch: () => {
						openApp({ program: "@arksouthern/luna.explore.find", params: { openPath: storeSelf.dir } })
					},
				}}
			>
				{handlers => (
					<XpWindow {...props} buttons={<XpTitleButtonsNormal {...props} />} title={<>
						<img class="ml-[.062rem] mr-1 w-3.5 h-3.5" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAFiUAABYlAUlSJPAAAALCSURBVDhPdZNvSFNRGMZvOEOIogLLjYS+2BfrSyZtU8Iiw4piEZouLDOJJkmWhAPT/JOZYcxi6rbKTVEnohvOqc106p1py6XOv4my6azcaJioBAn1dKYXhjAfeHm4557fw8t7zqF8SSqt3Ftaqjyt1fRktLdbCg3vR2mdbmReqezHPZFCcJiK2sls3Sqj0ai1WseXTSYLTCYrmppoVKl7oGwZxDt6FqUdNlw6+7j1oB8v3GfI8PAoJKpmvDKMoHpkAcbVPzD/Beh1oGkZKP8GXL1YNMr2554PpKICGMyrrs7+j4qhn3hhAyqdgIZA+lVAS1zlAkrswLW4smkOixdPOtjFYF6p6wzP1RYnsqY2N8u+A28XN/3lHJBN1pPFBhebxUs5RPF2M5hXudlvYloGFiAaAjLHgdxpoGAGyCMungBSyXpiTt8yCRAHUuH7GMwrz2A0GgtiTcAtM3D3yybk8eTPQFwfcL1sASTgWTAVsZ/BtqpePdgfq13CBSMg6CVDI2Ee93xfbv+D1OKvJIAvCwrgHmCQrZLL6PIbaieO6wBuK8BvA9I711BcP4eM+83usBARzWHxS7YNKMxvS7hT8wMnm/8hh/6NWo0NaWkfEB1djRNHhDRpP4vjxz+17WVq0VlfS2TD0OtnUVtrRUWFmcDyjUpMkDqPBV8R+jwBj+rqPiUtLS1hfv4XVlZWiDtI0ARSUmohEMiRl9eKzIc1FrZ/RAg5sx0M5lVDQ99Tl8u1AbvdbthsdtD0FCSSDgiFchQUtCInq9FJZpDEoaL2MJhXottynsUyvuZwOGC3z2FycgZG4xhUqm4yhyoS1IWYyHQLx5+f7vMehFKhrHORD+KL8lVjWo1pXa83kwc1AIWiG+KMykX+0Zu9ZIjSbd+CR54fHD8el0z6EdlcQ0pHqoVUI5vFfRLkzzvDocKY9inqP+OethPzSizLAAAAAElFTkSuQmCC" alt="My Computer" draggable="false" />
						<A.TitleText class="flex-1 pointer-events-none pr-1 tracking-[.032rem] overflow-hidden whitespace-nowrap text-ellipsis">
							{(storeSelf.dir?.slice(0, -1) || "My Computer").replaceAll("/", "\\")}
						</A.TitleText>
					</>}>
						{kbdShortcutOn({ app: props, keys: ["Ctrl", "A"], callback: handlers.anySelectAll })}
						{kbdShortcutOn({ app: props, keys: ["Ctrl", "C"], callback: handlers.itemsCopy })}
						{kbdShortcutOn({ app: props, keys: ["Ctrl", "I"], callback: handlers.displaySidebar('favorites') })}
						{kbdShortcutOn({ app: props, keys: ["Ctrl", "K"], callback: handlers.displaySidebar('tree') })}
						{kbdShortcutOn({ app: props, keys: ["Ctrl", "L"], callback: handlers.displaySidebar('none') })}
						{kbdShortcutOn({ app: props, keys: ["Ctrl", "V"], callback: handlers.itemsPaste })}
						<A.Toolbars style={{ background: `linear-gradient(to right, #F2F4F2 0%, #ECE8D0 100%)` }}>
							<A.AltBar class="relative h-5 mt-0.5 ml-0.5 mb-0.5 text-xs">
								<XpBarMenu>
									<XpBarMenuItem name="File">
										{/* <XpBarMenuLineItem>TODO Open Command Prompt</XpBarMenuLineItem> */}
										{/* <XpBarMenuDivider /> */}
										<XpBarMenuLineItem disabled>TODO New</XpBarMenuLineItem>
										<XpBarMenuDivider />
										<XpBarMenuLineItem disabled>TODO Create Shortcut</XpBarMenuLineItem>
										<XpBarMenuMasterItem
											onClick={async () => {
												await API.fileDangerouslyDelete({ filePath: `${storeSelf.dir}${storeSelf.networkDirCurrentFiles[storeSelf.selectedItems[0]].name}` })
												await updateDirThenCurrentFiles({ dir: storeSelf.dir })
											}}
											title="Delete"
											disabled={(storeSelf.selectedItems.length != 1 || !["shortcut", "file"].includes(storeSelf.networkDirCurrentFiles[storeSelf.selectedItems[0]].type.as)) as true}
										/>
										<XpBarMenuLineItem disabled>TODO Rename</XpBarMenuLineItem>
										<XpBarMenuMasterItem
											onClick={() => {
												openApp({ program: "@arksouthern/luna.explore.properties", params: { openPath: `${storeSelf.dir}${self.networkFavoritesFiles[storeSelf.selectedItems[0]].name}` } })
											}}
											disabled={(storeSelf.selectedItems.length != 1) as true}
											title="Properties"
										/>
										<XpBarMenuDivider />
										<XpBarMenuLineItem onClick={handlers.appClose}>Close</XpBarMenuLineItem>
									</XpBarMenuItem>
									<XpBarMenuItem name="Edit">
										<XpBarMenuLineItem disabled shortcut="Ctrl+Z">TODO Undo</XpBarMenuLineItem>
										<XpBarMenuDivider />
										<XpBarMenuLineItem disabled shortcut="Ctrl+X">TODO Cut</XpBarMenuLineItem>
										<XpBarMenuLineItem disabled={!storeSelf.selectedItems.length as true} onClick={handlers.itemsCopy} shortcut="Ctrl+C">Copy</XpBarMenuLineItem>
										<XpBarMenuLineItem onClick={handlers.itemsPaste} shortcut="Ctrl+V">Paste</XpBarMenuLineItem>
										<XpBarMenuLineItem disabled>TODO Paste Shortcut</XpBarMenuLineItem>
										<XpBarMenuDivider />
										<XpBarMenuLineItem disabled>TODO Copy To Folder...</XpBarMenuLineItem>
										<XpBarMenuLineItem disabled>TODO Move To Folder...</XpBarMenuLineItem>
										<XpBarMenuDivider />
										<XpBarMenuLineItem
											onClick={handlers.anySelectAll}
											shortcut="Ctrl+A"
										>Select All</XpBarMenuLineItem>
										<XpBarMenuLineItem
											onClick={handlers.anySelectInvert}
										>Invert Selection</XpBarMenuLineItem>
									</XpBarMenuItem>
									<XpBarMenuItem name="View">
										<XpBarMenuMasterItem
											title="Toolbars"
											xpBarMenuItemMasterList={<>
												<XpBarMenuMasterItem
													title="Standard Buttons"
													indicator={self.isViewButtonsBar ? "checked" : undefined}
													onClick={handlers.displayStandardButtonsToggle}
												/>
												<XpBarMenuMasterItem
													title="Address Bar"
													indicator={self.isViewAddressBar ? "checked" : undefined}
													onClick={handlers.displayAddressBarToggle}
												/>
												<XpBarMenuDivider />
												<XpBarMenuMasterItem
													title="Lock the Toolbars"
													indicator="checked"
													disabled
												/>
												<XpBarMenuMasterItem
													title="Customize..."
													disabled
												/>
											</>}
										/>
										<XpBarMenuCheckboxItem
											boolean={self.isViewStatusBar}
											onClick={handlers.displayStatusBarToggle}
										>
											Status Bar
										</XpBarMenuCheckboxItem>

										<XpBarMenuMasterItem
											title="Explorer Bar"
											xpBarMenuItemMasterList={<>
												<XpBarMenuMasterItem
													title="Search"
													shortcut="Ctrl+E"
													disabled
												/>
												<XpBarMenuMasterItem
													title="Favorites"
													indicator={self.viewSidebarMx.as == "favorites" ? "checked" : undefined}
													onClick={handlers.displaySidebar('favorites')}
													shortcut="Ctrl+I"
												/>
												<XpBarMenuMasterItem
													title="History"
													shortcut="Ctrl+H"
													disabled
												/>
												<XpBarMenuMasterItem
													title="Folders"
													indicator={self.viewSidebarMx.as == "tree" ? "checked" : undefined}
													shortcut="Ctrl+K"
													onClick={handlers.displaySidebar('tree')}
												/>
												<XpBarMenuDivider />
												<XpBarMenuMasterItem
													title="Hidden"
													shortcut="Ctrl+L"
													indicator={self.viewSidebarMx.as == "none" ? "checked" : undefined}
													onClick={handlers.displaySidebar('none')}
												/>
											</>}
										/>
										<XpBarMenuDivider />
										<XpBarMenuMasterItem
											title="Thumbnails"
											disabled
										/>
										<XpBarMenuMasterItem
											title="Tiles"
											disabled
										/>
										<XpBarMenuMasterItem
											title="Icons"
											indicator={storeSelf.viewIconListMx.as == "icons" ? "radio" : undefined}
											onClick={() => storeSelf.viewIconListMx.as = "icons"}
										/>
										<XpBarMenuMasterItem
											title="List"
											indicator={storeSelf.viewIconListMx.as == "list" ? "radio" : undefined}
											onClick={() => storeSelf.viewIconListMx.as = "list"}
										/>
										<XpBarMenuMasterItem
											title="Details"
											indicator={storeSelf.viewIconListMx.as == "details" ? "radio" : undefined}
											onClick={() => storeSelf.viewIconListMx.as = "details"}
										/>
										<XpBarMenuDivider />
										<XpBarMenuMasterItem title="Arrange Icons by" xpBarMenuItemMasterList={<>
											<XpBarMenuMasterItem title="Name" onClick={handlers.sortsFileListToggle("name")} indicator={storeSelf.sorts.find(x => x.as == "name") ? "checked" : undefined} />
											<XpBarMenuMasterItem title="Size" onClick={handlers.sortsFileListToggle("size")} indicator={storeSelf.sorts.find(x => x.as == "size") ? "checked" : undefined} />
											<XpBarMenuMasterItem title="Date Modified" onClick={handlers.sortsFileListToggle("dateModified")} indicator={storeSelf.sorts.find(x => x.as == "dateModified") ? "checked" : undefined} />
											<XpBarMenuMasterItem title="Date Created" onClick={handlers.sortsFileListToggle("dateCreated")} indicator={storeSelf.sorts.find(x => x.as == "dateCreated") ? "checked" : undefined} />
											{/* <XpBarMenuMasterItem title="Type" />   */}
											<XpBarMenuDivider />
											<XpBarMenuMasterItem disabled title="TODO Show in Groups" />
											<XpBarMenuMasterItem disabled title="Auto Arrange" />
											<XpBarMenuMasterItem disabled title="Align to Grid" />
										</>} />
										<XpBarMenuDivider />
										<XpBarMenuLineItem disabled>TODO Choose Details...</XpBarMenuLineItem>
										<XpBarMenuLineItem disabled>TODO Customize This Folder...</XpBarMenuLineItem>
										<XpBarMenuDivider />
										<XpBarMenuLineItem disabled>TODO Go To</XpBarMenuLineItem>
										<XpBarMenuLineItem onClick={() => updateDirThenCurrentFiles({ dir: storeSelf.dir })}>Refresh</XpBarMenuLineItem>
									</XpBarMenuItem>
									<XpBarMenuItem name="Favorites">
										<XpBarMenuLineItem disabled>TODO Add To Favorites...</XpBarMenuLineItem>
										<XpBarMenuLineItem disabled>Organize Favorites...</XpBarMenuLineItem>
										<XpBarMenuDivider />
										<For each={self.networkFavoritesFiles}>
											{fav => (
												<>
													{fav.type.as != "shortcut" ? "" : (
														<XpBarMenuMasterItem
															title={fav.name.replaceAll(".xp.json", "")}
															icon={
																<img
																	src={fav.type.shortcut.icon || getFileIconImg({ file: { name: fav.type.shortcut.params.openPath } })}
																/>
															}
															onClick={handlers.favClick(fav)}
														/>
													)}
												</>
											)}
										</For>
									</XpBarMenuItem>
									<XpBarMenuItem name="Tools">
										<XpBarMenuLineItem disabled>TODO Map Network Drive...</XpBarMenuLineItem>
										<XpBarMenuLineItem disabled>TODO Disconnect Network Drive...</XpBarMenuLineItem>
										<XpBarMenuLineItem disabled>TODO Syncronize...</XpBarMenuLineItem>
										<XpBarMenuDivider />
										<XpBarMenuLineItem onClick={() => {
											openApp({ program: "@arksouthern/luna.settings.folder-options", params: { openPath: "" } })
										}}>Folder Options...</XpBarMenuLineItem>
									</XpBarMenuItem>
									<XpBarMenuItem name="Help">
										<XpBarMenuLineItem onClick={setAbout.dialogShow}>About Ark Luna</XpBarMenuLineItem>
									</XpBarMenuItem>
								</XpBarMenu>
							</A.AltBar>
							<A.BorderY class="border-y border-t-[#D7D2BF] border-b-white h-0" />
							<Show when={self.isViewButtonsBar}>
								<A.FunctionBar class="h-9 flex items-center text-xs px-1">
									<A.NavFunctions class="flex items-center">
										<button disabled class="h-9 disabled:grayscale flex items-center rounded-sm border border-black/0 hover:border-[#CECEC4] active:text-white active:bg-[#E3E3DD]">
											<img class="w-7 h-7 -mx-[.062rem]" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAEeUlEQVR42u2Wa1CUZRiG/WBjOe32sdvuYoIrxzzkLkxYWYlmkYcWLEJL2BIHsgTSmSJhlvAAjofSNMR2B0aGQ7LBJAeXPbCcAl0FFFqmXUPlJEtFNUym1o/8cffuGo4cZ0X8UcM988x8/+7rfr7ned931qwZzei/JvOQGbJLMoQaQkGraVCVFBxOUQjSiRHREA75JQUsvw/goRhL26Vg17AhaVmL5I5EZJp3QN65ExnGOMSffRErtb7gf+0KjyIaaS2y6YMo7leCrqUR/d1G6H5WQWNRoqTnC+R2foJDHfHYfWEdPjQsRVKT2FaR1f7g57kiSCnGwIN2Q96jAFvPhrw3GzU/lqG8Lxf5VzKQZdqGzLYNSG1+6a7x6FpYyEFwIYEYmiKEYdAAqopCTncWVP2FKO46BMUPKThojMXOVgn2XIhA82Al1NfkE0PkcRBatGxqAKJ6Eba0SfFN75fIu7wHR77fioyLUUg2PI/9JP1ft29gWEc74iaEEBx2hdJYfH8Q8qty8NVcFF3dj+Pmj7CvPQay5jBsOxM8xtyqXa1rxjV/r/FJrK0QgpNBwzJksR9CXC3C5nOSMUM2nnnR5fQxxglNIsQ1LsKmbxdgY30gOHuZUJyV2wdguT4AhxIKstaIEUNmj3kiqS0kdSwxljY8gQ11/ois88XiXA7W5YTbB6Dp00BQ6o7tZ0ImNbfc6rQN4L1V2ZdNNiUbp3qzsKs9GhG187Ba742ni/kI2ieyH8C7hDWpuT0q6v4crxDzFdWPI6SMB0YSZSdADwEofnCAfLK2y3Sz8ZxOAHEFB4x4ewG6CUABa8S/HQ+i7bdalPUeQyk5Fa0n48nuI7bUBV2HcaLrMyS1RmKJlocgNQd++Sxw36ftAzD9YobDMWrMZI+G+JN872gNtw3ZqzVCrCLtXlk9By/oPPGsVoBgDRciYj6/6lEIjjpjefp9HEg+uUK8pQscAbCVrNbui5E242Hduv0HEs+vRpje6992eyJEw4OYGC+qouGncoePyg2sVAbSClLsB0jSJWDhCc7d1YonO21drZiGQHxMUluNh3WTfEc1LsEzWj6CyeG1WO2BgCo2fIm512lX8EuZYLxOwdRttB/A9FMHOJ/SWK8OwGZi/E7DfLxZH4A36vwQXjMPCST1zXsg5FcO2FIvIO22phaedoNnpTN4FUy4pTji7YPR938fyPSpeOyAC9br/RFFjF+r9cEa/VyyWl5YTlYr1vAybvx93Vax5yXwV7FIu90xp9IFfGLMKX8ELmSWOBE0TF3GqV1IUmUMuBlMrNJ4jxiypaOGzNruuaTdAmLMq3ACq8wRLgoKjmEUlNVfTf1N0P9rHyJyJPBId8JTpbwJh2w2abc1NV3OgBt5ojHT75gryo5Pz8sorTwV3GQa/ExnBJ5kjxgya2puuRPclQ5gZlJgSCj4RAlhMDZN79vQdK0DHxQkwHe7EE5SB7gmOcL5XVLxjmBEk8QryON0k2j6Uk+mc+YmaFtU0DbfKY1Bhf7BvodvPKP/nf4B4+9ZYa2mEQAAAAAASUVORK5CYII=" alt="" />
											<span class="mr-1">Back</span>
											<div class="h-full flex items-center mx-1 before:border-x-transparent before:border-y-black before:border-[3px] before:border-b-0" />
										</button>
										<button disabled class="h-9 disabled:grayscale flex items-center rounded-sm border border-black/0 hover:border-[#CECEC4] active:text-white active:bg-[#E3E3DD]">
											<img class="w-7 h-7 -mx-[.062rem]" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAEqElEQVR42u2WeUzbZRjH94NKuYqlbGWL0woMcDDa4tS5TPFCExA6HB6TsUyF6caxSyIIsgN0mzqUXbaBjADVVojjWCmUGwqdHIGBoxMcBUZR8EA3sxHdIl/fX6EFEtSC7A8NT/KkTZv8Pp/neZ/f+75LlizGYvzXQjuqReKlRPhp/MBWskEVU7A4S0GoEkBUGwzxJQn0vwzhtoDD28PhUOmAoOZAxHVGI1X7FsTd+5HSEYHIxifwZJkruJ/bwlHKRlJz4sJJyAblYFexEXbhZaiGFSjVy5HXdxyZ3e/gWGckDrZuxD7NesSoBYbcVL4K3CxbCOUCDP3bboj7JHCocIC4/xQqvy1A4UAmsr9JwfGLsdjX+DASmp5CatuLJvj09MrlwDeXSIzOU0IzogFVQiFDdwKKwVzIeo9B8nU8jl7YZoArr4jRNFKMQ60i7G8Jml0iiwM/6aPzE+DX8PF6Wzi+6P8EWT2H8PHFnQQWaoCnd0bAGGO3fsUR0oU4zYZZJZzTbCHvkM1NQnxZDK7SCdLLR3Ba+yYOt2/B21/6I1YtJALrcKAlANPDKLGrwXcG/I36NQgs4oGTwoZ+VG++hKCcj1fPB5mGbC+pmn4gXX2segIi7UmeVYL+b2e9D16p88LW2vuwudodnHeZkDSKzRPQXx2CRR6FxBaRYciM1dBwowDdiX+SCKi8B89W8hBS5QKfTA42ZgSbJ1A6UArnfHvsbnjA8KAD7WE423+CvAGnUEySHr7pqb/e/ZcSfqoV8FfdhYdkXAgP880XuDuPZapcqvsIcw1a4mBrCEKr3bChzBlrC5aCEUOZKdBHBGRTAtnk9ZtLjI+PY+hGP4JrvLFG6QihkgN+kSMYkeYK6IhAzpRATMsmnOn9EDm9acglKSVCMl0a8nTpKOg/ibYfq2YI0PCQWh94lzjCo8SBfLLhls2C0w62eQJd32thcZKa9Z2ennsb1hmG8gZptzFGxvQIrRUaKncncE+StIRzujUeS57DhuSSycNmlccMYLSaj+j6iaTfgj0ND+L6rWumto+MDSG0bgpOg90U9nBR2IGVwEBSTrz5AjGqKHid4UyCBdhBNpSoSTj92y71/fjpt2FT5cOkclEtH97kiKbhdLoS+MpztuDmM8F4jkKXrsN8ga7vOsH5gI0XlO7YXudtqnxikxHgva/24OYfNyfXfADPVK/GarLWniV3YpWChXvP2WF5sTWWFTFhF2+Jre+Hzf08SKxIwNKjNnip0h2vkV0tgmRolSu8CMi/RoCea1pc/f1nBJLvNNjT0HIWVhbbgEvAnMI7YENmiSNio6u3Y34HUrh8C5xSmAgoJbtaBQ+PlC0na2pvWFsa6EMm3bjmdMtXFNFVW4FVYAkbCQXLpynIyz+d/51g8IcBiDKC4JhshbX5y7CebCq+5JCiwfRwGYfMWDW7kAE7ckVjJk/AJQWnF+ZmlFSYAKc4Nrip1vD4bOaQOROwU6EV7OUWYKZSYARRcHmeB02HemHvhl1XOhGbEwXX3TxYhVvANsYS1ttJRlqCEUYqfpxcTrfxF67qv4vzWjXKmhUoa5rIUo0CgyMDtx+8GP+7+BOtKFbTGHQVFwAAAABJRU5ErkJggg==" alt="" />
											<div class="h-full flex items-center mx-1 before:border-x-transparent before:border-y-black before:border-[3px] before:border-b-0" />
										</button>
										<button
											disabled={!storeSelf.dir}
											class="h-9 disabled:grayscale flex items-center rounded-sm border border-black/0 hover:border-[#CECEC4] active:text-white active:bg-[#E3E3DD] px-0.5 py-1.5"
											onClick={handlers.navDirUp}>
											<img class="w-[1.375rem] h-[1.375rem]" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAYAAACpSkzOAAAEwElEQVR42tWVe0zVdRiHrdZqy2U4aWJeADcZKoiAQ7JNVhKCCpShoPBHpqkT81ZaIiBOBT0mKghCipCEIBOKg0cOh4tcBA6XuESAwDmHw+FyRAVFEbmdp5/mbKzEa1t9t+ff99n7fj9731Gj/qvPK2olZvtnIpIe5F+T7Ez+lnf2jGZMyBuMCxiDQ4j9y5eFZYZicXQm+hFvYZSgh1nSeExO6WOwUx/f5F0vT+h2+lPGBQuSeD3Mfx7P3NSJfCydir3YGOtwQ+aJbPgxL0b5QpKNcd5MCTbAMPZPie2FSTjIpuKSbYJX4Sw8c8xZlGSKbegMNsavf77uQjNCsA6xYPIPesxIfBfr5Al8lGaE60PJ6mJL3NKnYx3xHob79JjsY8CycDfE5WK7EQu3yn24T8tDPjlkjb7PWKYdMsQmbBaWYdOYGzsRzwJz1pRY8aXABzHGhOYfJK44uj06/yRJxecCRpS0FPnQJt9OV/1xbjZGclMRTGzGDvbHuxOa+h0x+afZkrAO88Nj8cg2Y22pNd6VtliGT3m2cTWlOdJzTcLQQAY6XQ4gob83ixuN0bRXHKO9KhyxbBNuJ01xFps+kGytnf/sIk2mCwzKBEHEX+jiudeVQGfdLq6WraChYhVRRStxSjZlW50dOxoXYHXCkMKSYLS1cXH3ebIoywmGooTiJ4YzdFrgFLqhMPp7ROTWrMJRSNl9iV/zIqxPGJErcUWT5Ulr3jrUBdvQ1id99VhRs8we7oUJHPsbQ71H6OvaK/zfBi6kObDw/HT8NYsJaHMREmdEZX0idzqK6bujoblgC8r8rY8fp0piBx3HBfYypA1goM2XgdZdD7ir2EJHyXKuVflRpE5mScosAtpdONC1XBidMVc6KoRR3+W2Ng9llheqIr9/Ft1Up+opU2zQNR1Ap9xJV8kK1NL3UUmsHmLJ9ep9QlCqKG4LwkU8W5C4I7rlgZXIhCtXc4QAtaDKWoZa7j9yOBqTLNDV+NIj90RT4E1vl5zBvjKBHAGpIBELxZIfiYI63fn88nx2/OREW2e68H85KGQLURfvf7yI0ojX6xNMGCzfSqt4Dt2t6Qz2JwrjOCMQIyAEglM0dQRxJOszXFNns0e7HLPvJ1FWupl7d6WoLrkK3fg+Oeq1cYb0lnijTJlH3+0idP3RMHB8GNLfvFkab8X2BmcWn7dk9y9OdCn8GOw5S7N8LdorSWtGlID/q7/HGtBdtJ6Wwq8ZvC2BnnCB4EeoW/wRyVyZF2XCslQbYUvMR6n2YUC9G02uI5rywCd3I8zllcpoPa7letGtSWOoMxI6RQJBj0iXr8ZF2NC2h40JFC+krMob3Y1ABhq2UXN2AprqpzgTcO618qjRaGTODHTXoGsLhNbdw8jI82JTpCWiM3Mov+TM9ZKltF92pDXTnsZ0t6dfQ79GvU1Tpjt05YHSj6GGb+ir3UhP5RfcKvWgSvoh2Uk2KDIcUGcsoTFtMfVSNxoubQBV9ptPLao4MwFtpYie2r3cknvQmeeMNtuJZpkjCskC6sR21ElcUORtRlMRSltjiuNzHbnK2Ml01ESiuriAWiFR1YkW1F1ciqrQl9bqFzzTwzuaSGWcCc3lR9EqLpiN+j++PwBbsefO+2FUcAAAAABJRU5ErkJggg==" alt="" />
											{/* <img class="w-7 h-7 -mx-[.062rem] -rotate-90" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAEqElEQVR42u2WeUzbZRjH94NKuYqlbGWL0woMcDDa4tS5TPFCExA6HB6TsUyF6caxSyIIsgN0mzqUXbaBjADVVojjWCmUGwqdHIGBoxMcBUZR8EA3sxHdIl/fX6EFEtSC7A8NT/KkTZv8Pp/neZ/f+75LlizGYvzXQjuqReKlRPhp/MBWskEVU7A4S0GoEkBUGwzxJQn0vwzhtoDD28PhUOmAoOZAxHVGI1X7FsTd+5HSEYHIxifwZJkruJ/bwlHKRlJz4sJJyAblYFexEXbhZaiGFSjVy5HXdxyZ3e/gWGckDrZuxD7NesSoBYbcVL4K3CxbCOUCDP3bboj7JHCocIC4/xQqvy1A4UAmsr9JwfGLsdjX+DASmp5CatuLJvj09MrlwDeXSIzOU0IzogFVQiFDdwKKwVzIeo9B8nU8jl7YZoArr4jRNFKMQ60i7G8Jml0iiwM/6aPzE+DX8PF6Wzi+6P8EWT2H8PHFnQQWaoCnd0bAGGO3fsUR0oU4zYZZJZzTbCHvkM1NQnxZDK7SCdLLR3Ba+yYOt2/B21/6I1YtJALrcKAlANPDKLGrwXcG/I36NQgs4oGTwoZ+VG++hKCcj1fPB5mGbC+pmn4gXX2segIi7UmeVYL+b2e9D16p88LW2vuwudodnHeZkDSKzRPQXx2CRR6FxBaRYciM1dBwowDdiX+SCKi8B89W8hBS5QKfTA42ZgSbJ1A6UArnfHvsbnjA8KAD7WE423+CvAGnUEySHr7pqb/e/ZcSfqoV8FfdhYdkXAgP880XuDuPZapcqvsIcw1a4mBrCEKr3bChzBlrC5aCEUOZKdBHBGRTAtnk9ZtLjI+PY+hGP4JrvLFG6QihkgN+kSMYkeYK6IhAzpRATMsmnOn9EDm9acglKSVCMl0a8nTpKOg/ibYfq2YI0PCQWh94lzjCo8SBfLLhls2C0w62eQJd32thcZKa9Z2ennsb1hmG8gZptzFGxvQIrRUaKncncE+StIRzujUeS57DhuSSycNmlccMYLSaj+j6iaTfgj0ND+L6rWumto+MDSG0bgpOg90U9nBR2IGVwEBSTrz5AjGqKHid4UyCBdhBNpSoSTj92y71/fjpt2FT5cOkclEtH97kiKbhdLoS+MpztuDmM8F4jkKXrsN8ga7vOsH5gI0XlO7YXudtqnxikxHgva/24OYfNyfXfADPVK/GarLWniV3YpWChXvP2WF5sTWWFTFhF2+Jre+Hzf08SKxIwNKjNnip0h2vkV0tgmRolSu8CMi/RoCea1pc/f1nBJLvNNjT0HIWVhbbgEvAnMI7YENmiSNio6u3Y34HUrh8C5xSmAgoJbtaBQ+PlC0na2pvWFsa6EMm3bjmdMtXFNFVW4FVYAkbCQXLpynIyz+d/51g8IcBiDKC4JhshbX5y7CebCq+5JCiwfRwGYfMWDW7kAE7ckVjJk/AJQWnF+ZmlFSYAKc4Nrip1vD4bOaQOROwU6EV7OUWYKZSYARRcHmeB02HemHvhl1XOhGbEwXX3TxYhVvANsYS1ttJRlqCEUYqfpxcTrfxF67qv4vzWjXKmhUoa5rIUo0CgyMDtx+8GP+7+BOtKFbTGHQVFwAAAABJRU5ErkJggg==" alt="" /> */}
										</button>
										<A.Divider class='h-7 w-[.062rem] bg-black/25 mx-0.5'></A.Divider>
										<button
											onClick={handlers.openSearch}
											class="h-9 disabled:grayscale flex items-center rounded-sm border border-black/0 hover:border-[#CECEC4] active:text-white active:bg-[#E3E3DD]"
										>
											<img
												class="w-7 h-7 -mx-[.062rem]"
												src="/src/assets/ico/1375.ico"
												alt=""
											/>
											<span class="mr-1">Search</span>
										</button>
										<button
											aria-selected={self.viewSidebarMx.as == "tree"}
											onClick={handlers.displaySidebar('tree')}
											class="h-9 disabled:grayscale flex items-center rounded-sm border border-black/0 aria-selected:border-[#8097AD] aria-selected:bg-white hover:border-[#CECEC4] active:text-white active:bg-[#E3E3DD]"
										>
											<img
												class="w-7 h-7 p-0.5 -mx-[.062rem]"
												src="/src/assets/ico/35.ico"
												alt=""
											/>
											<span class="mr-1">Folders</span>
										</button>
										<button
											aria-selected={self.viewSidebarMx.as == "favorites"}
											onClick={handlers.displaySidebar('favorites')}
											class="h-9 disabled:grayscale flex items-center rounded-sm border border-black/0 aria-selected:border-[#8097AD] aria-selected:bg-white hover:border-[#CECEC4] active:text-white active:bg-[#E3E3DD]"
										>
											<img
												class="w-7 h-7 p-0.5 -mx-[.062rem]"
												src="/src/assets/shell32/44.ico"
												alt=""
											/>
											<span class="mr-1">Favorites</span>
										</button>
										<A.Divider class='h-7 w-[.062rem] bg-black/25 mx-0.5'></A.Divider>
										<XpDropDownMenu
											placement='bottom-start'
											xpDropDownTrigger={(
												<XpDropDownTrigger disabled={!storeSelf.dir}>
													<button
														disabled={!storeSelf.dir}
														class="h-9 disabled:grayscale flex items-center rounded-sm border border-black/0 hover:border-[#CECEC4] active:text-white active:bg-[#E3E3DD] pl-1 pr-0.5 py-1.5"
													>
														<img class="w-5 h-5 -mx-[.062rem]" src="/src/assets/ico/160.ico" alt="" />
														<div class="h-full flex items-center mx-1 before:border-x-transparent before:border-y-black before:border-[3px] before:border-b-0" />
													</button>
												</XpDropDownTrigger>
											)}
											xpDropDownItemList={<>
												<For each={["details", "icons", "list"] as const}>
													{x => (
														<XpDropDownItem
															title={<span class="capitalize">{x}</span>}
															indicator={storeSelf.viewIconListMx.as == x ? "radio" : undefined}
															onClick={() => storeSelf.viewIconListMx.as = x}
														/>
													)}
												</For>
											</>}
										/>
									</A.NavFunctions>
								</A.FunctionBar>
								<A.BorderY class="h-0 border-y border-t-[#D7D2BF] border-b-white" />
							</Show>
							<Show when={self.isViewAddressBar}>
								<A.AddressBar class="text-xs flex items-center pr-0.5 h-5" style={{ "box-shadow": `#CCCABD 0px -1.25px 1px 0px inset` }}>
									<div class="p-1.5 text-black/50 leading-[100%]">Address</div>
									<A.ContextContainer class="border border-[#859CB6] bg-white relative flex h-full flex-1 items-center gap-1">
										<img class="w-3.5 h-3.5" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAFiUAABYlAUlSJPAAAALCSURBVDhPdZNvSFNRGMZvOEOIogLLjYS+2BfrSyZtU8Iiw4piEZouLDOJJkmWhAPT/JOZYcxi6rbKTVEnohvOqc106p1py6XOv4my6azcaJioBAn1dKYXhjAfeHm4557fw8t7zqF8SSqt3Ftaqjyt1fRktLdbCg3vR2mdbmReqezHPZFCcJiK2sls3Sqj0ai1WseXTSYLTCYrmppoVKl7oGwZxDt6FqUdNlw6+7j1oB8v3GfI8PAoJKpmvDKMoHpkAcbVPzD/Beh1oGkZKP8GXL1YNMr2554PpKICGMyrrs7+j4qhn3hhAyqdgIZA+lVAS1zlAkrswLW4smkOixdPOtjFYF6p6wzP1RYnsqY2N8u+A28XN/3lHJBN1pPFBhebxUs5RPF2M5hXudlvYloGFiAaAjLHgdxpoGAGyCMungBSyXpiTt8yCRAHUuH7GMwrz2A0GgtiTcAtM3D3yybk8eTPQFwfcL1sASTgWTAVsZ/BtqpePdgfq13CBSMg6CVDI2Ee93xfbv+D1OKvJIAvCwrgHmCQrZLL6PIbaieO6wBuK8BvA9I711BcP4eM+83usBARzWHxS7YNKMxvS7hT8wMnm/8hh/6NWo0NaWkfEB1djRNHhDRpP4vjxz+17WVq0VlfS2TD0OtnUVtrRUWFmcDyjUpMkDqPBV8R+jwBj+rqPiUtLS1hfv4XVlZWiDtI0ARSUmohEMiRl9eKzIc1FrZ/RAg5sx0M5lVDQ99Tl8u1AbvdbthsdtD0FCSSDgiFchQUtCInq9FJZpDEoaL2MJhXottynsUyvuZwOGC3z2FycgZG4xhUqm4yhyoS1IWYyHQLx5+f7vMehFKhrHORD+KL8lVjWo1pXa83kwc1AIWiG+KMykX+0Zu9ZIjSbd+CR54fHD8el0z6EdlcQ0pHqoVUI5vFfRLkzzvDocKY9inqP+OethPzSizLAAAAAElFTkSuQmCC" alt="ie" />
										<input
											class="flex-1 h-full outline-none"
											onChange={e => storeSelf.dir = e.currentTarget.value}
											onKeyDown={async e => {
												if (e.key != 'Enter') return
												updateDirThenCurrentFiles({ dir: e.currentTarget.value })
											}}
											value={storeSelf.dir || "My Computer"}
										/>
									</A.ContextContainer>
									<A.GoButton onClick={async () => {
										await API.folderRead({ dir: storeSelf.dir })
									}} class="hover:brightness-110 hover:bg-[#F6F6F2] border-x border-black/0 hover:border-[#CECEC4] flex items-center h-full relative pr-1.5 mr-3.5 ml-0.5 pl-0.5">
										<img class="h-[95%] mr-1 border border-white rounded-sm" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAYAAAAfSC3RAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsQAAA7EAZUrDhsAAAJPSURBVDhPjZHbS9phHMZ/RVIUJZ1VLDErsJNGVHbCMpQOYlQSVBQdCIsCuxg127K20U3URazWgcpSy85mx0Eb7Krb3Y3tr/ksf7qLXW0feK/e7/M83/d5hdDPEDNPMzhuHfRf9mM/tdMR6KDN30b7UTsWnwXjgZG6/TrKt8rRrGhYflpGmH2aZe/7HivPK7i+uJj+PM3E3QRjN2OMXI8wcDVAz3kPtoCNpsMmdOs65LNyhMn7SVafV1n8tojz0YnjxsHQ1RB3v+4IYz2y0upvFUW1e7XoN/TkzuUiDAYHmfs6JyaNXo/Sd95H13GXKPpDxXYF+m09+i29mKiZ1yB0n3Yz9TDF+N04g5eD2E/sWH1WTB5TVBZBu6mleKuY0o1SNO4XYbiI0dAow8Fhes976TzupMXbgtFjpGq3KiqLULhdSNFmEWq3GsHsNdN30Re9+jcFOwXkLOQghJ3D6/4vqn0VsncyhMqdSvG/uk66RAPbiY3WwEuLJ00YzgzR8QjyCzkyr4y092kIJZ9KMB2YxNrD77UGrFgCFhrPGqPjERS3CjKCGUh9UpIWkxDy1vIw7Bpo9jbT4m/BfGTGdPx3o+p7NbIHGSmhFBJ8CUjcEgT5qpxwavVuNQ2eBuo99dQc1uD74RNF+cF8lCEl6TfpJF4mEueJI9YVi5D6IRXVioqitSJ0H3WUrZeJRtodLZp9DUqfkkx/Jsn+ZCQeCTFrMQhOAWHpcQmpU0rWqywUMwrxyF7LyHZlkz6fTvJCMonuROLfxhP75iVpWmDheoHfNvbnLyE6SFEAAAAASUVORK5CYII=" alt="go" />
										<div>Go</div>
									</A.GoButton>
								</A.AddressBar>
							</Show>
						</A.Toolbars>
						<A.MainContent class="border-l border-b border-l-[rgb(237,237,229)] border-b-white flex-1 block text-[.75rem] overflow-y-auto bg-white" style={{}}>
							<MatchAs over={self.viewSidebarMx} match={{
								none: () => <></>,
								prompts: x => (
									<A.ContentSidebar
										class="overflow-auto [flex-basis:0] float-start w-1/4 max-w-56 min-w-48 p-2.5 space-y-3 sticky h-full top-0"
										style={{ background: `linear-gradient(#82A0E0, #6674D0)` }}>
										<XpAsideAccordion title="System Tasks">
											<XpAsideAccordionItem
												icon="/src/assets/shell32/271.ico"
												children="Add or remove programs"
												onClick={() => openApp({ program: "@arksouthern/luna.stellar", params: { openPath: "" } })}
											/>
											<XpAsideAccordionItem
												icon="/src/assets/ico/182.ico"
												children="Change a setting"
												onClick={() => {
													updateDirThenCurrentFiles({ dir: "../data/Settings/" })
												}}
											/>
										</XpAsideAccordion>
										<Show when={storeSelf.dir}>
											<XpAsideAccordion title="File and Folder Tasks">
												<Show when={storeSelf.selectedItems.length} fallback={
													<>
														<XpAsideAccordionItem
															icon="/src/assets/shell32/319.ico"
															children="Make a new folder"
															disabled
															onClick={() => { }}
														/>
														<XpAsideAccordionItem
															icon="/src/assets/vs0710/Objects2012/png_format/WinVista/cmd.png"
															children="Open this folder in Command Prompt"
															onClick={() => {
																openApp({ program: "@arksouthern/luna.shell", params: { openPath: `cd ${storeSelf.dir}` } })
															}}
														/>
														<XpAsideAccordionItem
															icon="/src/assets/shell32/237.ico"
															children="Add this folder to your Music Library"
															onClick={async () => {
																await apiCreateShortcut({
																	file: {
																		type: { as: "folder" },
																		name: storeSelf.dir.split("/").pop()?.split("\\").pop()
																	} as any,
																	openPath: storeSelf.dir,
																	saveLocation: "Music"
																})
															}}
														/>
														<XpAsideAccordionItem
															icon="/src/assets/shell32/314.ico"
															children="Add this folder to your Game Library"
															onClick={async () => {
																await apiCreateShortcut({
																	file: {
																		type: { as: "folder" },
																		name: storeSelf.dir.split("/").pop()?.split("\\").pop()
																	} as any,
																	openPath: storeSelf.dir,
																	saveLocation: "Games"
																})
															}}
														/>
														<XpAsideAccordionItem
															icon="/src/assets/shell32/173.ico"
															children="Favorite this folder"
															onClick={async () => {
																await apiCreateShortcut({
																	file: {
																		type: { as: "folder" },
																		name: storeSelf.dir.split("/").filter(Boolean).pop()?.split("\\").filter(Boolean).pop()
																	} as any,
																	openPath: storeSelf.dir,
																	saveLocation: "Favorites"
																})
															}}
														/>
													</>
												}>
													<XpAsideAccordionItem
														icon="/src/assets/shell32/35.ico"
														onClick={async () => {
															const file = storeSelf.networkDirCurrentFiles[storeSelf.selectedItems[0]]
															await apiCreateShortcut({ file, openPath: `${storeSelf.dir}${file.name}`, saveLocation: "Desktop" })
														}}
														children="Create Desktop shortcut"
													/>
													<XpAsideAccordionItem
														disabled
														icon="/src/assets/ico/856.ico"
														onClick={() => { }}
														children="Rename this file"
													/>
													<XpAsideAccordionItem
														disabled
														icon="/src/assets/ico/475.ico"
														onClick={() => { }}
														children="Move this file"
													/>
													<XpAsideAccordionItem
														disabled
														icon="/src/assets/ico/541.ico"
														onClick={() => { }}
														children="Copy this file"
													/>
													<XpAsideAccordionItem
														disabled
														icon="/src/assets/ico/848.ico"
														onClick={() => { }}
														children="Delete this file"
													/>
												</Show>
											</XpAsideAccordion>
										</Show>
										<XpAsideAccordion title="Other Places">
											<XpAsideAccordionItem
												disabled
												icon="/src/assets/ico/170.ico"
												onClick={() => { }}
												children="Recent Documents"
											/>
											<XpAsideAccordionItem
												icon="/src/assets/ico/796.ico"
												onClick={async () => {
													updateDirThenCurrentFiles({ dir: "../data/Documents/" })
												}}
												children="My Documents"
											/>
											<XpAsideAccordionItem
												icon="/src/assets/ico/123.ico"
												onClick={async () => {
													storeSelf.networkDirCurrentFiles = [] // await API.fileExplorerReadFolder({ dir: "/" })
													storeSelf.dir = ""
												}}
												children="My Computer"
											/>
										</XpAsideAccordion>
										<XpAsideAccordion title="Details">
											<div class="leading-3 text-[.62rem]">
												{
													!storeSelf.selectedItems.length ?
														<>
															<A.Title class="font-semibold">{storeSelf.dir.split("/").filter(Boolean).pop() || "My Computer"}</A.Title>
															<A.Type>File Folder</A.Type>
															<A.Spacer class="h-0" />
														</> :
														storeSelf.selectedItems.length > 1 ?
															<>
																{storeSelf.selectedItems.length} items selected.
															</> :
															<>
																<Variables item={storeSelf.networkDirCurrentFiles[storeSelf.selectedItems[0]]}>
																	{props => (
																		<>
																			<A.Title class="font-semibold">{props.item.name}</A.Title>
																			<A.Type>
																				<MatchAs over={props.item.type}
																					match={{
																						file: () => <>{props.item.name.split(".").pop()?.toUpperCase()} File</>,
																						folder: () => <>File Folder</>,
																						locked: () => <>Locked File</>,
																						shortcut: () => <>Shortcut File</>
																					}}
																				/>
																			</A.Type>
																			<A.Spacer class="h-1" />
																			<A.Type>Date Modified: {new Date(props.item.mtimeMs).toLocaleString()}</A.Type>
																			<A.Spacer class="h-1" />
																			<A.Type>Size: {humanFileSize(props.item.size)}</A.Type>
																		</>
																	)}
																</Variables>
															</>
												}
											</div>
										</XpAsideAccordion>
									</A.ContentSidebar>
								),
								tree: x => (
									<A.TreeSidebar class="float-start w-1/4 max-w-64 min-w-48 pr-1 sticky h-full flex flex-col top-0 bg-[linear-gradient(90deg,#F3F5F7,#EBE9DA)]">
										<A.Title class="px-1 py-0.5 text-[.62rem] flex">
											<span class="flex-1">
												Folders
											</span>
											<A.Close
												class="w-4 h-4 leading-[1.2rem] flex items-center justify-center hover:bg-white/30 rounded-sm border-black/30 hover:border"
												onClick={() => self.viewSidebarMx = { as: "prompts" }}
											>
												x
											</A.Close>
										</A.Title>
										<A.Inner class="bg-white pl-1.5 overflow-auto flex-1 [flex-basis:0] border-t border-[#ABA89B]">
											<DirTree
												path="/"
												dirTree={self.networkTreeDir}
											/>
										</A.Inner>
									</A.TreeSidebar>
								),
								favorites: x => (
									<A.TreeSidebar class="float-start w-1/4 max-w-64 min-w-48 pr-1 sticky h-full flex flex-col top-0 bg-[linear-gradient(90deg,#F3F5F7,#EBE9DA)]">
										<A.Title class="px-1 py-0.5 text-[.62rem] flex">
											<span class="flex-1">
												Favorites
											</span>
											<A.Close
												class="w-4 h-4 leading-[1.2rem] flex items-center justify-center hover:bg-white/30 rounded-sm border-black/30 hover:border"
												onClick={() => self.viewSidebarMx = { as: "prompts" }}
											>
												x
											</A.Close>
										</A.Title>
										<A.Inner class="bg-white px-0.5 overflow-auto text-xs flex-1 [flex-basis:0] border-t border-[#ABA89B]">
											<For each={self.networkFavoritesFiles}>
												{file => (
													<>
														{file.type.as != "shortcut" ? "" : (
															<A.File
																class="flex gap-0.5 items-center hover:underline hover:text-[#4069BF] active:bg-[#4069BF] active:text-white aria-selected:bg-[#EBE9DA]"
																aria-selected={file.type.shortcut.params.openPath == storeSelf.dir}
																onClick={handlers.favClick(file)}
															>
																<img class="w-5 h-5" src={file.type.shortcut.icon || getFileIconImg({ file: { name: file.type.shortcut.params.openPath } })} />
																<p>
																	<span class="hover:cursor-pointer">
																		{file.name.replaceAll(".xp.json", "")}
																	</span>
																</p>
															</A.File>
														)}
													</>
												)}
											</For>
										</A.Inner>
									</A.TreeSidebar>
								)
							}} />
							<Show
								when={storeSelf.networkDirCurrentFiles.length}
								fallback={
									<div class="flex-1 bg-white outline-none overflow-x-auto  h-full resize-none">
										<A.DiskDrives>
											<A.BorderT class="border-t border-[#96abff]" />
											<A.FileSection>
												<A.FileSectionHeader class='font-bold pl-3'>Files Stored on This Computer</A.FileSectionHeader>
												<A.FileSectionDivider class='h-0.5 bg-gradient-to-r from-[rgb(112,191,255)] to-white w-2/3 mb-4 ' />
												<A.DiskDrive class='flex items-center' onDblClick={async () => {
													updateDirThenCurrentFiles({ dir: "../data/" })
												}}>
													<img class='w-11 h-11 mr-1 ml-4' src="/src/assets/shell32/259.ico" />
													<p class='tracking-tighter'>My Home Folder</p>
												</A.DiskDrive>
											</A.FileSection>
											<A.SpaceY class="h-5" />
											<A.FileSection>
												<A.FileSectionHeader class='font-bold pl-3'>Hard Disk Drives</A.FileSectionHeader>
												<A.FileSectionDivider class='h-0.5 bg-gradient-to-r from-[rgb(112,191,255)] to-white w-2/3 mb-4 ' />
												<A.DiskDrive onDblClick={async () => {
													updateDirThenCurrentFiles({ dir: "/" })
												}} class='flex items-center'>
													<img class='w-11 h-11 mr-1 ml-4' src="/src/assets/ico/73.ico" />
													<p class='tracking-tighter'>Host Disk</p>
												</A.DiskDrive>
											</A.FileSection>
										</A.DiskDrives>
									</div>
								}
							>
								<XpFileFiosView />
							</Show>
						</A.MainContent>
						{self.isViewStatusBar && (
							<A.StatusBar class="flex text-xs items-center pt-1 pb-0.5 bg-[#EBE9DA]" style={{ "box-shadow": `rgba(45, 45, 45, .4) 0 3px 3px -1px inset` }}>
								<A.Details class="flex-1 pl-0.5">
									{
										!storeSelf.selectedItems.length ?
											<>
												{storeSelf.networkDirCurrentFiles.length} objects
											</> :
											storeSelf.selectedItems.length > 1 ?
												<>
													{storeSelf.selectedItems.length} objects selected
												</> :
												<>
													{storeSelf.networkDirCurrentFiles[storeSelf.selectedItems[0]].name}
												</>
									}
								</A.Details>
								<A.Border class="w-px h-full mx-2 border-l border-r border-l-[#C4C1B1] border-r-[#FFFFFF]" />
								<A.Size class="w-24">
									{storeSelf.selectedItems.length == 1 && humanFileSize(storeSelf.networkDirCurrentFiles[storeSelf.selectedItems[0]].size || 0)}
								</A.Size>
								<A.Border class="w-px h-full mx-2 border-l border-r border-l-[#C4C1B1] border-r-[#FFFFFF]" />
								<A.Home class="w-24">
									My Computer
								</A.Home>
							</A.StatusBar>
						)}
					</XpWindow>
				)}
			</HandleSet>
		</A.FileExplorer>
	)
}

function getFileIconImg(props: { file: { name: string } }) {
	const { name } = props.file
	const ico = (id: number) => `/src/assets/ico/${id}.ico`
	if (name.startsWith("."))
		return ico(523)
	const opener = queryFileOpener({ openPath: name })
	if (opener.as == "opener") return opener.opener.icon
	return ico(1070)
}

// https://stackoverflow.com/questions/10420352/converting-file-size-in-bytes-to-human-readable-string
function humanFileSize(size: number) {
	const i = Math.floor(Math.log(size) / Math.log(1024))
	return `${(size / 1024 ** i).toFixed(2)} ${['B', 'KB', 'MB', 'GB', 'TB'][i]}`.replace(".00", "")
}

async function apiCreateShortcut(props: { file: FioStat, openPath: string, saveLocation: SaveLocation }) {
	let sc = { prog: "@arksouthern/luna.explore", icon: "/src/assets/ico/23.ico" }
	// @ts-ignore
	if (props.file.type.as == "folder");
	// @ts-ignore
	else if (props.file.type.as == "locked");
	else {
		const [ext, info] = Object.entries(store.desktopOpener.extensions).find(x => props.file.name.endsWith(`.${x}`)) || [null, null]
		if (ext && info) {
			sc = info
		}
	}
	await API.shortcutCreateBasic({ progName: props.file.name, saveLocation: props.saveLocation, params: { openPath: props.openPath }, ...sc })
}