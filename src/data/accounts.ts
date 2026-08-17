/**
 * ATENÇÃO — não é autenticação real: login é 100% client-side, senha em
 * texto puro neste array, qualquer um com o bundle JS lê as credenciais no
 * DevTools. Serve só para a demo atual. Antes de expor isto na rede da
 * empresa, precisa de um backend de auth de verdade (ver relatório).
 */
export interface Account {
  email: string;
  password: string;
  name: string;
}

export const ACCOUNTS: Account[] = [
  { email: "mateus.vicentino", password: "123", name: "Mateus Vicentino" },
  { email: "pedro.ribeiro", password: "123", name: "Pedro Ribeiro" },
];
