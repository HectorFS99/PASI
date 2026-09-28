import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useFeedback } from '../context/FeedbackContext';

export interface PaginaResultado<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ConsultaPaginada<F> {
  page: number;
  search: string;
  filtros: F;
}

interface Options<T, F> {
  /** Busca uma página na API a partir da página, do texto de busca e dos filtros. */
  fetcher: (consulta: ConsultaPaginada<F>) => Promise<PaginaResultado<T>>;
  /** Filtros iniciais/"Limpar tudo". Use uma constante de módulo (referência estável). */
  filtrosPadrao: F;
  /** Toast exibido quando a busca falha. */
  mensagemErro: string;
  /** Espera após a última tecla antes de buscar. */
  debounceMs?: number;
}

/**
 * Estado completo de uma listagem paginada com busca e modal de filtros:
 * carrega ao focar a tela, aplica debounce na busca, descarta respostas
 * fora de ordem e mantém um rascunho dos filtros enquanto o modal está aberto.
 */
export function usePaginatedList<T, F>({
  fetcher,
  filtrosPadrao,
  mensagemErro,
  debounceMs = 400,
}: Options<T, F>) {
  const { toast } = useFeedback();

  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearchState] = useState('');
  const [filtros, setFiltros] = useState<F>(filtrosPadrao);
  const [filtrosDraft, setFiltrosDraft] = useState<F>(filtrosPadrao);
  const [filtrosVisiveis, setFiltrosVisiveis] = useState(false);

  // Refs com o valor mais recente — evitam closures desatualizadas nos callbacks.
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const toastRef = useRef(toast);
  toastRef.current = toast;
  const searchRef = useRef(search);
  const filtrosRef = useRef(filtros);
  const ultimaRequisicao = useRef(0);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const carregar = useCallback(
    async (p = 1, q = searchRef.current, f = filtrosRef.current) => {
      const id = ++ultimaRequisicao.current;
      setLoading(true);
      try {
        const res = await fetcherRef.current({ page: p, search: q, filtros: f });
        // Uma busca mais nova já foi disparada: ignora esta resposta.
        if (id !== ultimaRequisicao.current) return;
        setItems(res.data);
        setTotal(res.total);
        setPage(res.page);
        setTotalPages(res.totalPages);
      } catch {
        if (id === ultimaRequisicao.current) toastRef.current(mensagemErro, 'error');
      } finally {
        if (id === ultimaRequisicao.current) setLoading(false);
      }
    },
    [mensagemErro],
  );

  // Recarrega sempre que a tela ganha foco (ex.: ao voltar de criar/editar).
  useFocusEffect(
    useCallback(() => {
      carregar(1);
    }, [carregar]),
  );

  useEffect(() => () => clearTimeout(debounceTimer.current), []);

  const setSearch = (texto: string) => {
    setSearchState(texto);
    searchRef.current = texto;
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => carregar(1, texto), debounceMs);
  };

  const aplicar = (f: F) => {
    setFiltros(f);
    filtrosRef.current = f;
    setFiltrosVisiveis(false);
    carregar(1, searchRef.current, f);
  };

  return {
    items,
    total,
    page,
    totalPages,
    loading,
    search,
    setSearch,
    irParaPagina: (p: number) => carregar(p),
    /** Recarrega a página atual (ex.: após uma ação em um item). */
    recarregar: () => carregar(page),

    filtros,
    filtrosAtivos: JSON.stringify(filtros) !== JSON.stringify(filtrosPadrao),
    filtrosDraft,
    /** Altera campos do rascunho de filtros (só vale após aplicar). */
    editarFiltros: (patch: Partial<F>) => setFiltrosDraft((prev) => ({ ...prev, ...patch })),
    filtrosVisiveis,
    abrirFiltros: () => {
      setFiltrosDraft(filtros);
      setFiltrosVisiveis(true);
    },
    fecharFiltros: () => setFiltrosVisiveis(false),
    aplicarFiltros: () => aplicar(filtrosDraft),
    limparFiltros: () => {
      setFiltrosDraft(filtrosPadrao);
      aplicar(filtrosPadrao);
    },
  };
}
