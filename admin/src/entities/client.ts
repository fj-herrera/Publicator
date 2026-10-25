export type Client = {
  id: number
  name: string
  logo: string | null
  inPublications: number
}

export type ClientInput = {
  name: string
  logo: string | null
}