import React from 'react'
import { describe, test, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import GradeSectionNavigator from './GradeSectionNavigator'
import KeyboardShortcutsModal from './KeyboardShortcutsModal'
import EmptyState from './EmptyState'
import { SkeletonTable, SkeletonCard, SkeletonGradeCards } from './Skeleton'
import { useUIStore } from '../../store/uiStore'

const grades = [
  { _id: 'g1', name: 'Grade 1', level: 1, sections: ['A', 'B'] },
  { _id: 'g2', name: 'Grade 2', level: 2, sections: [{ name: 'C' }] },
]
const students = [
  { classId: 'g1', section: 'A' },
  { classId: { _id: 'g1' }, sectionId: 'A' },
  { classId: 'g1', section: 'B' },
  { classId: 'g2', section: 'C' },
]

describe('GradeSectionNavigator', () => {
  test('shows the grade selector and a pill per section of the selected grade', () => {
    render(<GradeSectionNavigator grades={grades} selectedGrade={grades[0]} selectedSection="A" />)
    expect(screen.getByRole('combobox', { name: 'Select grade' })).toHaveValue('g1')
    expect(screen.getByRole('button', { name: /Section A/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Section B/ })).toBeInTheDocument()
  })

  test('defaults to the first grade, and accepts a grade id instead of an object', () => {
    const { rerender } = render(<GradeSectionNavigator grades={grades} />)
    expect(screen.getByRole('combobox', { name: 'Select grade' })).toHaveValue('g1')
    rerender(<GradeSectionNavigator grades={grades} selectedGrade="g2" />)
    expect(screen.getByRole('combobox', { name: 'Select grade' })).toHaveValue('g2')
  })

  test('counts students per section and in total when a student list is given', () => {
    render(<GradeSectionNavigator grades={grades} selectedGrade={grades[0]} selectedSection="A" students={students} />)
    expect(within(screen.getByRole('button', { name: /Section A/ })).getByText('2')).toBeInTheDocument()
    expect(within(screen.getByRole('button', { name: /Section B/ })).getByText('1')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument() // grade total
  })

  test('clicking a section pill reports it', async () => {
    const onSelectSection = vi.fn()
    render(<GradeSectionNavigator grades={grades} selectedGrade={grades[0]} selectedSection="A" onSelectSection={onSelectSection} />)
    await userEvent.click(screen.getByRole('button', { name: /Section B/ }))
    expect(onSelectSection).toHaveBeenCalledWith('B')
  })

  test('choosing another grade reports it and moves to that grade\'s first section when the old one does not exist there', async () => {
    const onSelectGrade = vi.fn()
    const onSelectSection = vi.fn()
    render(<GradeSectionNavigator grades={grades} selectedGrade={grades[0]} selectedSection="A" onSelectGrade={onSelectGrade} onSelectSection={onSelectSection} />)

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Select grade' }), 'g2')

    expect(onSelectGrade).toHaveBeenCalledWith(grades[1])
    expect(onSelectSection).toHaveBeenCalledWith('C')
  })

  test('keeps the current section when the new grade has it too', async () => {
    const both = [grades[0], { _id: 'g3', name: 'Grade 3', level: 3, sections: ['A', 'D'] }]
    const onSelectSection = vi.fn()
    render(<GradeSectionNavigator grades={both} selectedGrade={both[0]} selectedSection="A" onSelectGrade={vi.fn()} onSelectSection={onSelectSection} />)

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Select grade' }), 'g3')

    expect(onSelectSection).not.toHaveBeenCalled()
  })

  test('renders extra actions in the right-hand slot', () => {
    render(<GradeSectionNavigator grades={grades} rightSlot={<button>Print all</button>} />)
    expect(screen.getByRole('button', { name: 'Print all' })).toBeInTheDocument()
  })

  test('copes with no grades at all', () => {
    render(<GradeSectionNavigator />)
    expect(screen.getByRole('combobox', { name: 'Select grade' })).toBeInTheDocument()
  })
})

describe('KeyboardShortcutsModal', () => {
  test('is closed by default and opens from the UI store with every shortcut group', () => {
    useUIStore.setState({ isShortcutsModalOpen: false })
    const { rerender } = render(<KeyboardShortcutsModal />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    useUIStore.setState({ isShortcutsModalOpen: true })
    rerender(<KeyboardShortcutsModal />)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    for (const group of ['Global System Actions', 'Quick Navigation Sequences', 'Forms, Tables & Dialogs']) {
      expect(screen.getByText(group)).toBeInTheDocument()
    }
    expect(screen.getByText('Navigate to Finance & Fee Collection')).toBeInTheDocument()
  })

  test('closes through the UI store when dismissed', async () => {
    useUIStore.setState({ isShortcutsModalOpen: true })
    render(<KeyboardShortcutsModal />)
    await userEvent.keyboard('{Escape}')
    expect(useUIStore.getState().isShortcutsModalOpen).toBe(false)
  })
})

describe('EmptyState and skeletons', () => {
  test('EmptyState shows its title and description, and an action when given one', async () => {
    const onClick = vi.fn()
    render(<EmptyState title="Nothing here" description="Add your first record" action={{ label: 'Add', onClick }} />)
    expect(screen.getByText('Nothing here')).toBeInTheDocument()
    expect(screen.queryByRole('heading')).not.toBeInTheDocument() // a title here must not disturb the page's heading order
    expect(screen.getByText('Add your first record')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Add' }))
    expect(onClick).toHaveBeenCalled()
  })

  test('the skeleton placeholders render the requested number of rows or cards', () => {
    const { container: table } = render(<SkeletonTable rows={4} cols={3} />)
    expect(table.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
    const { container: card } = render(<SkeletonCard />)
    expect(card.firstChild).not.toBeNull()
    const { container: cards } = render(<SkeletonGradeCards />)
    expect(cards.firstChild).not.toBeNull()
  })
})
