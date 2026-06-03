import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export interface StateUF {
  id: number;
  sigla: string;
  nome: string;
}

export interface City {
  id: number;
  nome: string;
}

export function useLocation(initialState?: string) {
  const [states, setStates] = useState<StateUF[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedState, setSelectedState] = useState<string>(initialState || '');
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  // Fetch States
  useEffect(() => {
    let mounted = true;
    setLoadingStates(true);
    fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome')
      .then((res) => res.json())
      .then((data) => {
        if (mounted) setStates(data);
      })
      .catch((err) => {
        console.error('Erro ao buscar estados:', err);
        toast.error('Erro ao carregar os estados.');
      })
      .finally(() => {
        if (mounted) setLoadingStates(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Fetch Cities when state changes
  useEffect(() => {
    if (!selectedState) {
      setCities([]);
      return;
    }

    let mounted = true;
    setLoadingCities(true);
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedState}/municipios?orderBy=nome`)
      .then((res) => res.json())
      .then((data) => {
        if (mounted) setCities(data);
      })
      .catch((err) => {
        console.error('Erro ao buscar cidades:', err);
        toast.error('Erro ao carregar as cidades.');
      })
      .finally(() => {
        if (mounted) setLoadingCities(false);
      });

    return () => {
      mounted = false;
    };
  }, [selectedState]);

  return {
    states,
    cities,
    selectedState,
    setSelectedState,
    loadingStates,
    loadingCities,
  };
}
