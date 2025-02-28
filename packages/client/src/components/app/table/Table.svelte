<script>
  import { getContext } from "svelte"
  import { Table, Skeleton } from "@budibase/bbui"
  import SlotRenderer from "./SlotRenderer.svelte"
  import { UnsortableTypes } from "../../../constants"
  import { onDestroy } from "svelte"

  export let dataProvider
  export let columns
  export let rowCount
  export let quiet
  export let size
  export let allowSelectRows
  export let compact
  export let onClick

  const loading = getContext("loading")
  const component = getContext("component")
  const { styleable, getAction, ActionTypes, rowSelectionStore } =
    getContext("sdk")
  const customColumnKey = `custom-${Math.random()}`
  const customRenderers = [
    {
      column: customColumnKey,
      component: SlotRenderer,
    },
  ]

  let selectedRows = []

  $: hasChildren = $component.children
  $: data = dataProvider?.rows || []
  $: fullSchema = dataProvider?.schema ?? {}
  $: fields = getFields(fullSchema, columns, false)
  $: schema = getFilteredSchema(fullSchema, fields, hasChildren)
  $: setSorting = getAction(
    dataProvider?.id,
    ActionTypes.SetDataProviderSorting
  )
  $: table = dataProvider?.datasource?.type === "table"
  $: {
    rowSelectionStore.actions.updateSelection(
      $component.id,
      selectedRows.length ? selectedRows[0].tableId : "",
      selectedRows.map(row => row._id)
    )
  }

  const getFields = (schema, customColumns, showAutoColumns) => {
    // Check for an invalid column selection
    let invalid = false
    customColumns?.forEach(column => {
      const columnName = typeof column === "string" ? column : column.name
      if (schema[columnName] == null) {
        invalid = true
      }
    })

    // Use column selection if it exists
    if (!invalid && customColumns?.length) {
      return customColumns
    }

    // Otherwise generate columns
    let columns = []
    let autoColumns = []
    Object.entries(schema).forEach(([field, fieldSchema]) => {
      if (!fieldSchema?.autocolumn) {
        columns.push(field)
      } else if (showAutoColumns) {
        autoColumns.push(field)
      }
    })
    return columns.concat(autoColumns)
  }

  const getFilteredSchema = (schema, fields, hasChildren) => {
    let newSchema = {}
    if (hasChildren) {
      newSchema[customColumnKey] = {
        displayName: null,
        order: 0,
        sortable: false,
        divider: true,
        width: "auto",
        preventSelectRow: true,
      }
    }

    fields.forEach(field => {
      const columnName = typeof field === "string" ? field : field.name
      if (!schema[columnName]) {
        return
      }
      newSchema[columnName] = schema[columnName]
      if (UnsortableTypes.includes(schema[columnName].type)) {
        newSchema[columnName].sortable = false
      }

      // Add additional settings like width etc
      if (typeof field === "object") {
        newSchema[columnName] = {
          ...newSchema[columnName],
          ...field,
        }
      }
    })
    return newSchema
  }

  const onSort = e => {
    setSorting({
      column: e.detail.column,
      order: e.detail.order,
    })
  }

  const handleClick = e => {
    if (onClick) {
      onClick({ row: e.detail })
    }
  }

  onDestroy(() => {
    rowSelectionStore.actions.updateSelection($component.id, [])
  })
</script>

<div use:styleable={$component.styles} class={size}>
  <Table
    {data}
    {schema}
    loading={$loading}
    {rowCount}
    {quiet}
    {compact}
    {customRenderers}
    {allowSelectRows}
    bind:selectedRows
    allowEditRows={false}
    allowEditColumns={false}
    showAutoColumns={true}
    disableSorting
    autoSortColumns={!columns?.length}
    on:sort={onSort}
    on:click={handleClick}
  >
    <div class="skeleton" slot="loadingIndicator">
      <Skeleton />
    </div>
    <slot />
  </Table>
  {#if allowSelectRows && selectedRows.length}
    <div class="row-count">
      {selectedRows.length} row{selectedRows.length === 1 ? "" : "s"} selected
    </div>
  {/if}
</div>

<style>
  div {
    background-color: var(--spectrum-alias-background-color-secondary);
  }

  .skeleton {
    height: 100%;
    width: 100%;
  }

  .row-count {
    margin-top: var(--spacing-l);
  }
</style>
