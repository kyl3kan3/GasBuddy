// Shared display catalog; the API always computes charges from this trusted data.
export const FUEL_TYPES = [
  { value: 'regular', label: 'Regular', price: 3.45 },
  { value: 'plus', label: 'Plus', price: 3.75 },
  { value: 'premium', label: 'Premium', price: 4.05 },
  { value: 'diesel', label: 'Diesel', price: 4.25 },
] as const;
export const SERVICE_FEE_CENTS = 499;

export function quoteFuel(gasType: unknown, quantity: unknown) {
  const fuel = FUEL_TYPES.find(item => item.value === gasType);
  if (!fuel || typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity < 5 || quantity > 50) {
    throw new Error('Select an allowed fuel type and a whole quantity from 5 to 50 gallons');
  }
  const totalCents = Math.round(fuel.price * 100) * quantity + SERVICE_FEE_CENTS;
  return { pricePerUnit: fuel.price, totalAmount: totalCents / 100, totalCents };
}
