import React from 'react'
import { describe, test, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DataTable from './DataTable'

const people = [
  { _id: 'a', name: 'Zainab', age: 30, city: 'Lahore' },
  { _id: 'b', name: 'Ali', age: 25, city: 'Karachi' },
  { _id: 'c', name: 'Bilal', age: 41, city: 'Lahore' },
]
const columns = [
  { header: 'Name', accessorKey: 'name' },
  { header: 'Age', accessorKey: 'age' },
  { header: 'City', accessorKey: 'city' },
]
const names = () => screen.getAllByRole('row').slice(1).map((r) => within(r).getAllByRole('cell')[0].textContent)

describe('DataTable', () => {
  test('renders a header per column and a row per record', () => {
    render(<DataTable columns={columns} data={people} />)
    expect(screen.getAllByRole('columnheader').map((h) => h.textContent)).toEqual(['Name', 'Age', 'City'])
    expect(names()).toEqual(['Zainab', 'Ali', 'Bilal'])
  })

  test('uses a column\'s cell renderer when it has one', () => {
    render(<DataTable columns={[{ header: 'Who', cell: (row) => <b>{row.name.toUpperCase()}</b> }]} data={people} />)
    expect(screen.getByText('ZAINAB')).toBeInTheDocument()
  })

  test('shows a loading state instead of the table', () => {
    render(<DataTable columns={columns} data={people} loading />)
    expect(screen.getByText('Loading records...')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  test('shows the empty message when there is nothing to show', () => {
    render(<DataTable columns={columns} data={[]} emptyMessage="No students yet" />)
    expect(screen.getByText('No students yet')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  test('search filters on any value, ignoring case, and says so when nothing matches', async () => {
    render(<DataTable columns={columns} data={people} />)
    const box = screen.getByPlaceholderText('Search in records...')

    await userEvent.type(box, 'lahore')
    expect(names()).toEqual(['Zainab', 'Bilal'])

    await userEvent.clear(box)
    await userEvent.type(box, 'nobody')
    expect(screen.getByText('No records found')).toBeInTheDocument()
    expect(screen.getByText(/No records matched your search query "nobody"/)).toBeInTheDocument()
  })

  test('clicking a header sorts ascending, then descending, then clears the sort', async () => {
    render(<DataTable columns={columns} data={people} />)
    const nameHeader = screen.getByRole('columnheader', { name: /Name/ })
    expect(nameHeader).toHaveAttribute('aria-sort', 'none')

    await userEvent.click(nameHeader)
    expect(names()).toEqual(['Ali', 'Bilal', 'Zainab'])
    expect(nameHeader).toHaveAttribute('aria-sort', 'ascending')

    await userEvent.click(nameHeader)
    expect(names()).toEqual(['Zainab', 'Bilal', 'Ali'])
    expect(nameHeader).toHaveAttribute('aria-sort', 'descending')

    await userEvent.click(nameHeader)
    expect(names()).toEqual(['Zainab', 'Ali', 'Bilal'])
  })

  test('numbers sort numerically, and the keyboard can sort too', async () => {
    render(<DataTable columns={columns} data={[...people, { _id: 'd', name: 'Dua', age: 9, city: 'X' }]} />)
    const ageHeader = screen.getByRole('columnheader', { name: /Age/ })

    ageHeader.focus()
    await userEvent.keyboard('{Enter}')

    expect(names()).toEqual(['Dua', 'Ali', 'Zainab', 'Bilal']) // 9, 25, 30, 41 (not "25" < "9")
  })

  test('a column with sortable:false has no sort affordance', () => {
    render(<DataTable columns={[{ header: 'Name', accessorKey: 'name', sortable: false }]} data={people} />)
    expect(screen.getByRole('columnheader', { name: 'Name' })).not.toHaveAttribute('aria-sort')
  })

  test('paginates, and changing the page size resets to page 1', async () => {
    const many = Array.from({ length: 12 }, (_, i) => ({ _id: `r${i}`, name: `Person ${String(i + 1).padStart(2, '0')}`, age: i, city: 'C' }))
    render(<DataTable columns={columns} data={many} initialPageSize={5} pageSizeOptions={[5, 10]} searchable={false} />)

    expect(names()).toHaveLength(5)
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument()
    expect(screen.getByTitle('Previous Page')).toBeDisabled()

    await userEvent.click(screen.getByTitle('Next Page'))
    expect(screen.getByText('Page 2 of 3')).toBeInTheDocument()
    expect(names()[0]).toBe('Person 06')

    await userEvent.click(screen.getByTitle('Next Page'))
    expect(names()).toHaveLength(2)
    expect(screen.getByTitle('Next Page')).toBeDisabled()

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Rows per page' }), '10')
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument()
    expect(names()).toHaveLength(10)
  })

  test('selection: row checkboxes, select-all, and the callback receives the ids', async () => {
    const onSelectionChange = vi.fn()
    render(<DataTable columns={columns} data={people} selectable onSelectionChange={onSelectionChange} />)
    const boxes = screen.getAllByRole('checkbox')
    expect(boxes).toHaveLength(4) // select-all + 3 rows

    await userEvent.click(boxes[1])
    expect(onSelectionChange).toHaveBeenLastCalledWith(['a'])
    expect(screen.getByText('1 selected')).toBeInTheDocument()

    await userEvent.click(boxes[0])
    expect(onSelectionChange).toHaveBeenLastCalledWith(['a', 'b', 'c'])

    await userEvent.click(boxes[0])
    expect(onSelectionChange).toHaveBeenLastCalledWith([])
  })

  test('bulk actions appear only while something is selected', async () => {
    render(<DataTable columns={columns} data={people} selectable bulkActions={(ids) => <button>Delete {ids.length}</button>} />)
    expect(screen.queryByRole('button', { name: /Delete/ })).not.toBeInTheDocument()

    await userEvent.click(screen.getAllByRole('checkbox')[2])

    expect(screen.getByRole('button', { name: 'Delete 1' })).toBeInTheDocument()
  })

  test('the clear-search button has an accessible name and empties the box', async () => {
    render(<DataTable columns={columns} data={people} />)
    const box = screen.getByPlaceholderText('Search in records...')
    await userEvent.type(box, 'ali')

    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }))

    expect(box).toHaveValue('')
    expect(names()).toHaveLength(3)
  })
})
