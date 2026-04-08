'use client'

import { useEffect } from 'react'
import { useToast } from '@/components/Toast'

export default function SessionExpiredNotice({ expired }: { expired?: boolean }) {
  const { toast } = useToast()

  useEffect(() => {
    if (expired) {
      toast('Oturumunuz sona erdi, lütfen tekrar giriş yapın', 'error')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
