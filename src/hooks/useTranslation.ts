import { useAppStore } from '@/store/useAppStore';
import { getTranslation, TranslationKey } from '@/utils/translations';

export function useTranslation() {
  const locale = useAppStore((state) => state.locale);
  const setLocale = useAppStore((state) => state.setLocale);
  
  const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
    return getTranslation(locale, key, params);
  };
  
  return {
    t,
    locale,
    setLocale,
  };
}

export default useTranslation;