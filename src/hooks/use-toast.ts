'use client';

// Inspired by react-hot-toast library
import * as React from 'react';

import type { ToastActionElement, ToastProps } from '@/components/ui/toast';

const LIMITE_TORRADEIRA = 1;
const ATRASO_REMOVER_TORRADEIRA = 1000000;

type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

const tiposDeAcao = {
  ADICIONAR_TORRADEIRA: 'ADD_TOAST',
  ATUALIZAR_TORRADEIRA: 'UPDATE_TOAST',
  DISPENSAR_TORRADEIRA: 'DISMISS_TOAST',
  REMOVER_TORRADEIRA: 'REMOVE_TOAST',
} as const;

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

type TipoAcao = typeof tiposDeAcao;

type Acao =
  | {
      type: TipoAcao['ADICIONAR_TORRADEIRA'];
      toast: ToasterToast;
    }
  | {
      type: TipoAcao['ATUALIZAR_TORRADEIRA'];
      toast: Partial<ToasterToast>;
    }
  | {
      type: TipoAcao['DISPENSAR_TORRADEIRA'];
      toastId?: ToasterToast['id'];
    }
  | {
      type: TipoAcao['REMOVER_TORRADEIRA'];
      toastId?: ToasterToast['id'];
    };

interface Estado {
  toasts: ToasterToast[];
}

const tempoLimiteTorradeira = new Map<string, ReturnType<typeof setTimeout>>();

const adicionarAFilaRemocao = (toastId: string) => {
  if (tempoLimiteTorradeira.has(toastId)) {
    return;
  }

  const timeout = setTimeout(() => {
    tempoLimiteTorradeira.delete(toastId);
    despachar({
      type: 'REMOVE_TOAST',
      toastId: toastId,
    });
  }, ATRASO_REMOVER_TORRADEIRA);

  tempoLimiteTorradeira.set(toastId, timeout);
};

export const redutor = (state: Estado, action: Acao): Estado => {
  switch (action.type) {
    case 'ADD_TOAST':
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, LIMITE_TORRADEIRA),
      };

    case 'UPDATE_TOAST':
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t,
        ),
      };

    case 'DISMISS_TOAST': {
      const { toastId } = action;

      // ! Side effects ! - This could be extracted into a dismissToast() action,
      // but I'll keep it here for simplicity
      if (toastId) {
        adicionarAFilaRemocao(toastId);
      } else {
        state.toasts.forEach((toast) => {
          adicionarAFilaRemocao(toast.id);
        });
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t,
        ),
      };
    }
    case 'REMOVE_TOAST':
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
  }
};

const ouvintes: Array<(state: Estado) => void> = [];

let estadoMemoria: Estado = { toasts: [] };

function despachar(action: Acao) {
  estadoMemoria = redutor(estadoMemoria, action);
  ouvintes.forEach((listener) => {
    listener(estadoMemoria);
  });
}

type Toast = Omit<ToasterToast, 'id'>;

function torrada({ ...props }: Toast) {
  const id = genId();

  const update = (props: ToasterToast) =>
    despachar({
      type: 'UPDATE_TOAST',
      toast: { ...props, id },
    });
  const dismiss = () => despachar({ type: 'DISMISS_TOAST', toastId: id });

  despachar({
    type: 'ADD_TOAST',
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
    },
  });

  return {
    id: id,
    dismiss,
    update,
  };
}

function useTorradeira() {
  const [state, setState] = React.useState<Estado>(estadoMemoria);

  React.useEffect(() => {
    ouvintes.push(setState);
    return () => {
      const index = ouvintes.indexOf(setState);
      if (index > -1) {
        ouvintes.splice(index, 1);
      }
    };
  }, [state]);

  return {
    ...state,
    toast: torrada,
    dismiss: (toastId?: string) =>
      despachar({ type: 'DISMISS_TOAST', toastId }),
  };
}

export { useTorradeira as useToast, torrada as toast };
