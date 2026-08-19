import { useQuery } from "@tanstack/react-query";
import countriesData from "../data/countries.json";

export type Country = {
  code: string;
  dialCode: string;
  flag: string;
  name: string;
};

export const countriesQueryKey = ["countries", "all"] as const;

export function useCountries() {
  return useQuery({
    queryKey: countriesQueryKey,
    queryFn: async () => {
      // Simulate network for UX or just return immediately
      return countriesData as Country[];
    },
    staleTime: Infinity,
    gcTime: Infinity,
    initialData: countriesData as Country[],
  });
}
