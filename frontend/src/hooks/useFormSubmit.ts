import { useRef, useState } from 'react';

export function useFormSubmit(onSubmit: () => Promise<void> | void) {
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      await onSubmit();
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return { submitting, handleSubmit };
}
