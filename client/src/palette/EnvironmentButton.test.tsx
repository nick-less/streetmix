import React from 'react'
import { vi } from 'vitest'
import { screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'

import { render } from '~/test/helpers/render'
import { toggleToolbox } from '~/src/store/slices/ui'
import EnvironmentButton from './EnvironmentButton'

vi.mock('../store/slices/ui', () => ({
  default: {},
  // We don't use these actions for anything, but they must return
  // a plain object or the dispatch() throws an error
  toggleToolbox: vi.fn(() => ({ type: 'MOCK_ACTION' }))
}))

// NOTE: Parent component includes this component's snapshot test.
describe('EnvironmentButton', () => {
  it('handles click action', async () => {
    render(<EnvironmentButton />)

    await userEvent.click(screen.getByRole('button'))

    expect(toggleToolbox).toBeCalled()
  })
})
