import { writable, get } from "svelte/store"
import { devToolsStore } from "./devTools.js"

const dispatchEvent = (type, data = {}) => {
  window.parent.postMessage({ type, data })
}

const createBuilderStore = () => {
  const initialState = {
    inBuilder: false,
    screen: null,
    selectedComponentId: null,
    editMode: false,
    previewId: null,
    theme: null,
    customTheme: null,
    previewDevice: "desktop",
    isDragging: false,
    navigation: null,
    hiddenComponentIds: [],

    // Legacy - allow the builder to specify a layout
    layout: null,
  }
  const store = writable(initialState)
  const actions = {
    selectComponent: id => {
      if (id === get(store).selectedComponentId) {
        return
      }
      store.update(state => ({
        ...state,
        editMode: false,
        selectedComponentId: id,
      }))
      devToolsStore.actions.setAllowSelection(false)
      dispatchEvent("select-component", { id })
    },
    updateProp: (prop, value) => {
      dispatchEvent("update-prop", { prop, value })
    },
    deleteComponent: id => {
      dispatchEvent("delete-component", { id })
    },
    duplicateComponent: id => {
      dispatchEvent("duplicate-component", { id })
    },
    notifyLoaded: () => {
      dispatchEvent("preview-loaded")
    },
    moveComponent: (componentId, destinationComponentId, mode) => {
      dispatchEvent("move-component", {
        componentId,
        destinationComponentId,
        mode,
      })
    },
    setDragging: dragging => {
      if (dragging === get(store).isDragging) {
        return
      }
      store.update(state => ({ ...state, isDragging: dragging }))
    },
    setEditMode: enabled => {
      if (enabled === get(store).editMode) {
        return
      }
      store.update(state => ({ ...state, editMode: enabled }))
    },
    clickNav: () => {
      dispatchEvent("click-nav")
    },
    requestAddComponent: () => {
      dispatchEvent("request-add-component")
    },
    highlightSetting: setting => {
      dispatchEvent("highlight-setting", { setting })
    },
  }
  return {
    ...store,
    set: state => store.set({ ...initialState, ...state }),
    actions,
  }
}

export const builderStore = createBuilderStore()
