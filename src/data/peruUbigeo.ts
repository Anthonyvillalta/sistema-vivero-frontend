export interface ProvinceData {
  name: string;
  districts: string[];
}

export interface DepartmentData {
  name: string;
  provinces: ProvinceData[];
}

export const PERU_UBIGEO: DepartmentData[] = [
  {
    name: 'Callao',
    provinces: [
      {
        name: 'Callao',
        districts: [
          'Bellavista',
          'Callao (Cercado)',
          'Carmen de La Legua-Reynoso',
          'La Perla',
          'La Punta',
          'Mi Perú',
          'Ventanilla'
        ]
      }
    ]
  },
  {
    name: 'Lima',
    provinces: [
      {
        name: 'Lima',
        districts: [
          'Ancón',
          'Ate',
          'Barranco',
          'Breña',
          'Carabayllo',
          'Chaclacayo',
          'Chorrillos',
          'Cieneguilla',
          'Comas',
          'El Agustino',
          'Independencia',
          'Jesús María',
          'La Molina',
          'La Victoria',
          'Lince',
          'Los Olivos',
          'Lurigancho-Chosica',
          'Lurín',
          'Magdalena del Mar',
          'Miraflores',
          'Pachacámac',
          'Pucusana',
          'Pueblo Libre',
          'Puente Piedra',
          'Punta Hermosa',
          'Punta Negra',
          'Rímac',
          'San Bartolo',
          'San Borja',
          'San Isidro',
          'San Juan de Lurigancho',
          'San Juan de Miraflores',
          'San Luis',
          'San Martín de Porres',
          'San Miguel',
          'Santa Anita',
          'Santa María del Mar',
          'Santa Rosa',
          'Santiago de Surco',
          'Surquillo',
          'Villa El Salvador',
          'Villa María del Triunfo'
        ]
      },
      {
        name: 'Cañete',
        districts: [
          'San Vicente de Cañete',
          'Asia',
          'Calango',
          'Cerro Azul',
          'Coayllo',
          'Chilca',
          'Imperial',
          'Lunahuaná',
          'Mala',
          'Nuevo Imperial',
          'Pacarán',
          'Quilmaná',
          'San Luis',
          'Santa Cruz de Flores',
          'Zúñiga'
        ]
      },
      {
        name: 'Huaral',
        districts: [
          'Huaral',
          'Atavillos Alto',
          'Atavillos Bajo',
          'Aucallama',
          'Chancay',
          'Ihuarí',
          'Lampián',
          'Pacaraos',
          'San Miguel de Acos',
          'Santa Cruz de Andamarca',
          'Sumbilca',
          'Veintisiete de Noviembre'
        ]
      },
      {
        name: 'Huaura',
        districts: [
          'Huacho',
          'Ámbar',
          'Caleta de Carquín',
          'Checras',
          'Hualmay',
          'Huaura',
          'Leoncio Prado',
          'Paccho',
          'Santa Leonor',
          'Santa María',
          'Sayán',
          'Végueta'
        ]
      },
      {
        name: 'Barranca',
        districts: [
          'Barranca',
          'Paramonga',
          'Pativilca',
          'Supe',
          'Supe Puerto'
        ]
      }
    ]
  },
  {
    name: 'Arequipa',
    provinces: [
      {
        name: 'Arequipa',
        districts: [
          'Arequipa',
          'Alto Selva Alegre',
          'Cayma',
          'Cerro Colorado',
          'Characato',
          'Chiguata',
          'Jacobo Hunter',
          'José Luis Bustamante y Rivero',
          'La Joya',
          'Mariano Melgar',
          'Miraflores',
          'Mollebaya',
          'Paucarpata',
          'Pocsi',
          'Polobaya',
          'Quequeña',
          'Sabandía',
          'Sachaca',
          'San Juan de Siguas',
          'San Juan de Tarucani',
          'Santa Isabel de Siguas',
          'Santa Rita de Siguas',
          'Socabaya',
          'Tiabaya',
          'Uchumayo',
          'Vítor',
          'Yanahuara',
          'Yarabamba',
          'Yura'
        ]
      },
      {
        name: 'Camaná',
        districts: [
          'Camaná',
          'José María Quimper',
          'Mariano Nicolás Valcárcel',
          'Mariscal Cáceres',
          'Nicolás de Piérola',
          'Ocoña',
          'Quilca',
          'Samuel Pastor'
        ]
      },
      {
        name: 'Islay',
        districts: [
          'Mollendo',
          'Cocachacra',
          'Dean Valdivia',
          'Islay',
          'Mejía',
          'Punta de Bombón'
        ]
      }
    ]
  },
  {
    name: 'La Libertad',
    provinces: [
      {
        name: 'Trujillo',
        districts: [
          'Trujillo',
          'El Porvenir',
          'Florencia de Mora',
          'Huanchaco',
          'La Esperanza',
          'Laredo',
          'Moche',
          'Poroto',
          'Salaverry',
          'Simbal',
          'Víctor Larco Herrera'
        ]
      },
      {
        name: 'Ascope',
        districts: [
          'Ascope',
          'Chicama',
          'Chocope',
          'Magdalena de Cao',
          'Paiján',
          'Rázuri',
          'Santiago de Cao',
          'Casa Grande'
        ]
      },
      {
        name: 'Pacasmayo',
        districts: [
          'San Pedro de Lloc',
          'Guadalupe',
          'Jequetepeque',
          'Pacasmayo',
          'San José'
        ]
      }
    ]
  },
  {
    name: 'Lambayeque',
    provinces: [
      {
        name: 'Chiclayo',
        districts: [
          'Chiclayo',
          'Chongoyape',
          'Eten',
          'Eten Puerto',
          'José Leonardo Ortiz',
          'La Victoria',
          'Lagunas',
          'Monsefú',
          'Nueva Arica',
          'Oyotún',
          'Pátapo',
          'Picks',
          'Pimentel',
          'Pomalca',
          'Pucalá',
          'Reque',
          'Santa Rosa',
          'Saña',
          'Cayaltí'
        ]
      },
      {
        name: 'Lambayeque',
        districts: [
          'Lambayeque',
          'Chochope',
          'Íllimo',
          'Jayanca',
          'Mochumí',
          'Mórrope',
          'Motupe',
          'Olmos',
          'Pacora',
          'Salas',
          'San José',
          'Túcume'
        ]
      },
      {
        name: 'Ferreñafe',
        districts: [
          'Ferreñafe',
          'Cañaris',
          'Inahuaya',
          'Incahuasi',
          'Manuel Antonio Mesones Muro',
          'Pítipo',
          'Pueblo Nuevo'
        ]
      }
    ]
  },
  {
    name: 'Piura',
    provinces: [
      {
        name: 'Piura',
        districts: [
          'Piura',
          'Castilla',
          'Catacaos',
          'Cura Mori',
          'El Taller',
          'La Arena',
          'La Unión',
          'Las Lomas',
          'Tambo Grande',
          'Veintiséis de Octubre'
        ]
      },
      {
        name: 'Sullana',
        districts: [
          'Sullana',
          'Bellavista',
          'Ignacio Escudero',
          'Lancones',
          'Marcavelica',
          'Miguel Checa',
          'Querecotillo',
          'Salitral'
        ]
      },
      {
        name: 'Talara',
        districts: [
          'Pariñas',
          'El Alto',
          'La Brea',
          'Lobitos',
          'Máncora',
          'Los Órganos'
        ]
      }
    ]
  },
  {
    name: 'Cusco',
    provinces: [
      {
        name: 'Cusco',
        districts: [
          'Cusco',
          'Ccorca',
          'Poroy',
          'San Jerónimo',
          'San Sebastián',
          'Santiago',
          'Saylla',
          'Wanchaq'
        ]
      },
      {
        name: 'Urubamba',
        districts: [
          'Urubamba',
          'Chinchero',
          'Huayllabamba',
          'Machupicchu',
          'Maras',
          'Ollantaytambo',
          'Yucay'
        ]
      },
      {
        name: 'Calca',
        districts: [
          'Calca',
          'Coya',
          'Lamay',
          'Lares',
          'Pisac',
          'San Salvador',
          'Taray',
          'Yanatile'
        ]
      }
    ]
  },
  {
    name: 'Junín',
    provinces: [
      {
        name: 'Huancayo',
        districts: [
          'Huancayo',
          'Carhuacallanga',
          'Chacapampa',
          'Chicche',
          'Chilca',
          'Chongos Alto',
          'Chupuro',
          'El Tambo',
          'Huacrapuquio',
          'Hualhuas',
          'Huancán',
          'Huasicancha',
          'Huayucachi',
          'Ingenio',
          'Pariahuanca',
          'Pilcomayo',
          'Pucará',
          'Quichuay',
          'Quilcas',
          'San Agustín',
          'San Jerónimo de Tunán',
          'Saño',
          'Sapallanga',
          'Sicaya',
          'Santo Domingo de Acobamba',
          'Viques'
        ]
      },
      {
        name: 'Chanchamayo',
        districts: [
          'Chanchamayo',
          'Perené',
          'Pichanaqui',
          'San Luis de Shuaro',
          'San Ramón',
          'Vítoc'
        ]
      }
    ]
  },
  {
    name: 'Ica',
    provinces: [
      {
        name: 'Ica',
        districts: [
          'Ica',
          'La Tinguiña',
          'Los Aquijes',
          'Ocucaje',
          'Pachacútec',
          'Parcona',
          'Pueblo Nuevo',
          'Salas',
          'San José de Los Molinos',
          'San Juan Bautista',
          'Santiago',
          'Subtanjalla',
          'Tate',
          'Yauca del Rosario'
        ]
      },
      {
        name: 'Chincha',
        districts: [
          'Chincha Alta',
          'Alto Larán',
          'Chavín',
          'Chincha Baja',
          'El Carmen',
          'Grocio Prado',
          'Pueblo Nuevo',
          'San Antonio de Lobería',
          'San Juan de Yanac',
          'Sunampe',
          'Tambo de Mora'
        ]
      },
      {
        name: 'Pisco',
        districts: [
          'Pisco',
          'Huancano',
          'Humay',
          'Independencia',
          'Paracas',
          'San Andrés',
          'San Clemente',
          'Túpac Amaru Inca'
        ]
      }
    ]
  },
  {
    name: 'Ancash',
    provinces: [
      {
        name: 'Huaraz',
        districts: [
          'Huaraz',
          'Cochabamba',
          'Colcabamba',
          'Huanchay',
          'Jangas',
          'La Libertad',
          'Oleros',
          'Pampas Grande',
          'Pariacoto',
          'Pira',
          'Tarica'
        ]
      },
      {
        name: 'Santa',
        districts: [
          'Chimbote',
          'Cáceres del Perú',
          'Coishco',
          'Macate',
          'Moro',
          'Nepeña',
          'Samanco',
          'Santa',
          'Nuevo Chimbote'
        ]
      }
    ]
  },
  {
    name: 'Cajamarca',
    provinces: [
      {
        name: 'Cajamarca',
        districts: [
          'Cajamarca',
          'Asunción',
          'Chetilla',
          'Cotorum',
          'Encañada',
          'Jesús',
          'Llacanora',
          'Magdalena',
          'Matara',
          'Namora',
          'San Juan'
        ]
      },
      {
        name: 'Jaén',
        districts: [
          'Jaén',
          'Bellavista',
          'Chontali',
          'Colasay',
          'Huabal',
          'Las Pirias',
          'Pucará',
          'Sallique',
          'San Felipe',
          'San José del Alto',
          'Santa Rosa'
        ]
      }
    ]
  },
  {
    name: 'Puno',
    provinces: [
      {
        name: 'Puno',
        districts: [
          'Puno',
          'Acora',
          'Amantaní',
          'Atuncolla',
          'Capachica',
          'Chucuito',
          'Coata',
          'Huata',
          'Mañazo',
          'Paucarcolla',
          'Platería',
          'San Antonio',
          'Tiquillaca',
          'Vílque'
        ]
      },
      {
        name: 'San Román',
        districts: [
          'Juliaca',
          'Cabana',
          'Cabanillas',
          'Caracoto'
        ]
      }
    ]
  },
  {
    name: 'Tacna',
    provinces: [
      {
        name: 'Tacna',
        districts: [
          'Tacna',
          'Alto de la Alianza',
          'Calana',
          'Ciudad Nueva',
          'Incline',
          'Pachía',
          'Palca',
          'Pocollay',
          'Sama',
          'Coronel Gregorio Albarracín Lanchipa',
          'La Yarada-Los Palos'
        ]
      }
    ]
  },
  {
    name: 'San Martín',
    provinces: [
      {
        name: 'San Martín',
        districts: [
          'Tarapoto',
          'Alberto Leveau',
          'Canserqui',
          'Chazuta',
          'Chipurana',
          'El Porvenir',
          'Huimbayoc',
          'Juan Guerra',
          'La Banda de Shilcayo',
          'Morales',
          'Papaplaya',
          'San Antonio',
          'Sauce',
          'Shapaja'
        ]
      }
    ]
  },
  {
    name: 'Huánuco',
    provinces: [
      {
        name: 'Huánuco',
        districts: [
          'Huánuco',
          'Amarilis',
          'Chinchao',
          'Churubamba',
          'Margos',
          'Quisqui',
          'San Francisco de Cayrán',
          'San Pedro de Chaulán',
          'Santa María del Valle',
          'Yarumayo',
          'Pillco Marca',
          'Yacus'
        ]
      }
    ]
  },
  {
    name: 'Loreto',
    provinces: [
      {
        name: 'Maynas',
        districts: [
          'Iquitos',
          'Alto Nanay',
          'Fernando Lores',
          'Indiana',
          'Las Amazonas',
          'Mazan',
          'Napo',
          'Punchana',
          'Torres Causana',
          'Belén',
          'San Juan Bautista'
        ]
      }
    ]
  },
  {
    name: 'Ucayali',
    provinces: [
      {
        name: 'Coronel Portillo',
        districts: [
          'Callería',
          'Campoverde',
          'Iparía',
          'Masisea',
          'Yarinacocha',
          'Nueva Requena',
          'Manantay'
        ]
      }
    ]
  },
  {
    name: 'Moquegua',
    provinces: [
      {
        name: 'Mariscal Nieto',
        districts: [
          'Moquegua',
          'Carumas',
          'Cuchumbaya',
          'Samegua',
          'San Cristóbal',
          'Torata'
        ]
      },
      {
        name: 'Ilo',
        districts: [
          'Ilo',
          'El Algarrobal',
          'Pacocha'
        ]
      }
    ]
  },
  {
    name: 'Ayacucho',
    provinces: [
      {
        name: 'Huamanga',
        districts: [
          'Ayacucho',
          'Acocro',
          'Acos Vinchos',
          'Carmen Alto',
          'Chiara',
          'Jesús Nazareno',
          'Ocros',
          'Pacaycasa',
          'Quinua',
          'San José de Ticllas',
          'San Juan Bautista',
          'Santiago de Pischa',
          'Socos',
          'Tambillo',
          'Vinchos'
        ]
      }
    ]
  }
];
