export const getPurchases = async () => {
  if (typeof window === 'undefined') return null;
  try {
    const Purchases = (await import('react-native-purchases')).default;
    return Purchases;
  } catch (e) {
    console.warn("RevenueCat não carregou neste ambiente.");
    return null;
  }
};