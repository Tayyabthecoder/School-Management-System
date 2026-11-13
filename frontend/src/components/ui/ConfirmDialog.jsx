import React from 'react'
import Modal from './Modal'
import Button from './Button'
import { useConfirmStore } from '../../store/confirmStore'

/** Single app-wide confirmation dialog, driven by `confirmAction()` from the confirm store. */
export default function ConfirmDialog() {
  const request = useConfirmStore((s) => s.request)
  const close = useConfirmStore((s) => s.close)

  return (
    <Modal
      open={Boolean(request)}
      onClose={() => close(false)}
      title={request?.title}
      size="sm"
      footer={(
        <>
          <Button type="button" variant="outline" onClick={() => close(false)}>
            {request?.cancelLabel}
          </Button>
          <Button type="button" variant={request?.danger ? 'danger' : 'primary'} onClick={() => close(true)}>
            {request?.confirmLabel}
          </Button>
        </>
      )}
    >
      <p className="text-sm leading-relaxed">{request?.message}</p>
    </Modal>
  )
}
