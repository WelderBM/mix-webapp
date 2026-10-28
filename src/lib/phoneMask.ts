// Máscara do telefone no carrinho: (95) 98424-4194.
// O hífen só entra quando já tem número depois dele; antes, apagar o hífen
// do fim recolocava ele na hora e a pessoa não conseguia corrigir o número.
export function maskPhone(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  const ddd = d.slice(0, 2);
  const rest = d.slice(2);
  if (rest.length <= 5) return `(${ddd}) ${rest}`;
  return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`;
}
