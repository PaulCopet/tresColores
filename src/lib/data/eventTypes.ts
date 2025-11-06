export type Integrante = {
  nombre: string;
  rol: string;
  descripcion?: string;
};

export type EventHistoria = {
  id: string;
  fecha: string;
  date: string;
  nombre: string;
  descripcion: string;
  integrantes?: Integrante[];
  ubicacion: string;
  city?: string;
  consecuencias?: string[];
  coverImagePath?: string;
  createdBy?: string;
  published?: boolean;
  createdAt?: any;
  updatedAt?: any;
};
