'use client';

import { useFormState } from 'react-dom';
import { useEffect } from 'react';
import { useToast } from '../ui/use-toast';
import { ActionFunction } from '@/utils/types';

const initialState = {
  message: '',
};

export default function FormContainer({
  action,
  children,
}: {
  action: ActionFunction;
  children: React.ReactNode;
}) {
  const [state, formAction] = useFormState(action, initialState);
  const { toast } = useToast();

  useEffect(() => {
    if (state.message) {
      toast({ description: state.message });
    }
  }, [state, toast]);

  return <form action={formAction}>{children}</form>;
}
