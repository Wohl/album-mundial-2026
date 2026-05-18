#!/usr/bin/env python3
"""
Corrige la asignación de imágenes de jugadores en los 15 equipos con PDFs.
Estrategia en 2 pasos para evitar conflictos de renombrado:
  Paso 1: current_name.png → current_name_tmp.png
  Paso 2: current_name_tmp.png → correct_name.png  (o DELETE)
"""
from pathlib import Path

PLAYERS_DIR = Path(__file__).parent.parent / "public" / "players"

# current_stem → correct_stem (o 'DELETE' para eliminar)
# Solo incluye archivos que necesitan cambio; los que no cambian se omiten.
RENAME_MAP = {
    'MEX': {
        'MEX_3':  'MEX_6',   # Gallardo → slot 6
        'MEX_4':  'MEX_3',   # Vásquez → slot 3
        'MEX_6':  'MEX_7',   # Israel Reyes → slot 7
        'MEX_7':  'MEX_4',   # Jorge Sánchez → slot 4
        'MEX_8':  'MEX_11',  # Orbelín Pineda → slot 11
        'MEX_9':  'MEX_8',   # Diego Lainez → slot 8
        'MEX_11': 'MEX_14',  # Érick Sánchez → slot 14
        'MEX_12': 'MEX_9',   # Carlos Rodríguez → slot 9
        'MEX_14': 'MEX_12',  # Marcel Ruiz → slot 12
        'MEX_15': 'MEX_17',  # Raúl Jiménez → slot 17
        'MEX_17': 'MEX_15',  # Hirving Lozano → slot 15
        'MEX_19': 'MEX_20',  # César Huerta → slot 20
        'MEX_20': 'MEX_19',  # Roberto Alvarado → slot 19
    },
    'GER': {
        'GER_3':  'GER_17',  # Kai Havertz → slot 17
        'GER_4':  'GER_20',  # Nick Woltemade → slot 20
        'GER_5':  'GER_16',  # Serge Gnabry → slot 16
        'GER_6':  'GER_19',  # Karim Adeyemi → slot 19
        'GER_7':  'GER_18',  # Leroy Sané → slot 18
        'GER_8':  'GER_14',  # Leon Goretzka → slot 14
        'GER_9':  'GER_11',  # Florian Wirtz → slot 11
        'GER_10': 'GER_12',  # Felix Nmecha → slot 12
        'GER_11': 'GER_10',  # Joshua Kimmich → slot 10
        'GER_12': 'GER_15',  # Jamal Musiala → slot 15
        'GER_14': 'GER_4',   # David Raum → slot 4
        'GER_15': 'GER_8',   # Ridle Baku → slot 8
        'GER_16': 'GER_5',   # Nico Schlotterbeck → slot 5
        'GER_17': 'GER_7',   # Waldemar Anton → slot 7
        'GER_18': 'GER_3',   # Jonathan Tah → slot 3
        'GER_19': 'GER_6',   # Antonio Rüdiger → slot 6
        'GER_20': 'GER_9',   # Maximilian Mittelstädt → slot 9
    },
    'ARG': {
        'ARG_3':  'ARG_17',  # Lionel Messi → slot 17
        'ARG_4':  'ARG_16',  # Nicolás González → slot 16
        'ARG_5':  'ARG_20',  # Giuliano Simeone → slot 20
        'ARG_6':  'ARG_19',  # Julián Álvarez → slot 19
        'ARG_7':  'ARG_18',  # Lautaro Martínez → slot 18
        'ARG_8':  'ARG_15',  # Franco Mastantuono → slot 15
        'ARG_9':  'ARG_8',   # Enzo Fernández → slot 8
        'ARG_10': 'ARG_9',   # Alexis Mac Allister → slot 9
        'ARG_11': 'ARG_14',  # Nico Paz → slot 14
        'ARG_14': 'ARG_10',  # Rodrigo De Paul → slot 10
        'ARG_15': 'ARG_11',  # Exequiel Palacios → slot 11
        'ARG_16': 'ARG_4',   # Cristian Romero → slot 4
        'ARG_17': 'ARG_7',   # Leonardo Balerdi → slot 7
        'ARG_18': 'ARG_5',   # Nicolás Otamendi → slot 5
        'ARG_19': 'ARG_3',   # Nahuel Molina → slot 3
        'ARG_20': 'ARG_6',   # Nicolás Tagliafico → slot 6
    },
    'BRA': {
        # PDF no incluye GKs (Alisson/Bento): slots 2 y 3 quedarán sin imagen
        'BRA_2':  'BRA_4',   # Marquinhos → slot 4
        'BRA_3':  'BRA_8',   # Wesley → slot 8
        'BRA_4':  'BRA_5',   # Éder Militão → slot 5
        'BRA_5':  'BRA_6',   # Gabriel Magalhães → slot 6
        'BRA_6':  'BRA_7',   # Danilo → slot 7
        'BRA_7':  'BRA_11',  # Bruno Guimarães → slot 11
        'BRA_8':  'BRA_9',   # Lucas Paquetá → slot 9
        'BRA_9':  'BRA_10',  # Casemiro → slot 10
        'BRA_10': 'BRA_12',  # Luiz Henrique → slot 12
        'BRA_11': 'BRA_14',  # Vinícius Jr → slot 14
        'BRA_12': 'BRA_18',  # Gabriel Martinelli → slot 18
        'BRA_14': 'BRA_19',  # Raphinha → slot 19
        'BRA_15': 'BRA_20',  # Estévão → slot 20
        'BRA_16': 'BRA_17',  # Matheus Cunha → slot 17
        'BRA_17': 'BRA_15',  # Rodrygo → slot 15
        'BRA_18': 'BRA_16',  # João Pedro → slot 16
        'BRA_19': 'DELETE',  # "WE ARE BRAZIL" (foto grupal, sin jugador individual)
        'BRA_20': 'DELETE',  # "WE ARE BRAZIL" (foto grupal, sin jugador individual)
    },
    'COL': {
        'COL_2':  'COL_3',   # David Ospina → slot 3
        'COL_3':  'COL_2',   # Camilo Vargas → slot 2
        'COL_4':  'COL_20',  # Luis Díaz → slot 20
        'COL_5':  'COL_18',  # Jhon Córdoba → slot 18
        'COL_6':  'COL_17',  # Jon/Jhon Arias → slot 17
        'COL_7':  'COL_19',  # Luis Suárez → slot 19
        'COL_8':  'COL_16',  # Jorge Carrascal → slot 16
        'COL_9':  'COL_12',  # Richard Ríos → slot 12
        'COL_10': 'COL_15',  # Juan Fernando Quintero → slot 15
        'COL_11': 'COL_14',  # James Rodríguez → slot 14
        'COL_12': 'COL_11',  # Kevin Castaño → slot 11
        'COL_14': 'COL_10',  # Jefferson Lerma → slot 10
        'COL_15': 'COL_9',   # Santiago Arias → slot 9
        'COL_16': 'COL_6',   # Daniel Muñoz → slot 6
        'COL_17': 'COL_5',   # Yerry Mina → slot 5
        'COL_18': 'COL_7',   # Johan Mojica → slot 7
        'COL_19': 'COL_4',   # Dávinson Sánchez → slot 4
        'COL_20': 'COL_8',   # Jhon Lucumí → slot 8
    },
    'CRO': {
        'CRO_3':  'CRO_20',  # Franjo Ivanović → slot 20
        'CRO_4':  'CRO_17',  # Marco Pašalić → slot 17
        'CRO_5':  'CRO_18',  # Ante Budimir → slot 18
        'CRO_6':  'CRO_19',  # Andrej Kramarić → slot 19
        'CRO_7':  'CRO_9',   # Luka Modrić → slot 9
        'CRO_8':  'CRO_10',  # Mateo Kovačić → slot 10
        'CRO_9':  'CRO_11',  # Martin Baturina → slot 11
        'CRO_10': 'CRO_14',  # Mario Pašalić → slot 14
        'CRO_11': 'CRO_15',  # Petar Sučić → slot 15
        'CRO_12': 'CRO_16',  # Ivan Perišić → slot 16
        'CRO_14': 'CRO_8',   # Kristijan Jakić → slot 8
        'CRO_15': 'CRO_3',   # Duje Ćaleta-Car → slot 3
        'CRO_16': 'CRO_5',   # Josip Stanišić → slot 5
        'CRO_17': 'CRO_6',   # Luka Vušković → slot 6
        'CRO_18': 'CRO_7',   # Josip Šutalo → slot 7
        'CRO_19': 'CRO_12',  # Lovro Majer → slot 12
        'CRO_20': 'CRO_4',   # Joško Gvardiol → slot 4
    },
    'ECU': {
        'ECU_4':  'ECU_20',  # Enner Valencia → slot 20
        'ECU_5':  'ECU_19',  # Kevin Rodríguez → slot 19
        'ECU_6':  'ECU_18',  # Alan Minda → slot 18
        'ECU_7':  'ECU_17',  # Nilson Angulo → slot 17
        'ECU_8':  'ECU_16',  # Gonzalo Plata → slot 16
        'ECU_9':  'ECU_15',  # Leonardo Campana → slot 15
        'ECU_10': 'ECU_12',  # Pedro Vite → slot 12
        'ECU_12': 'ECU_10',  # Alan Franco → slot 10
        'ECU_14': 'ECU_9',   # Moisés Caicedo → slot 9
        'ECU_15': 'ECU_8',   # Joel Ordóñez → slot 8
        'ECU_16': 'ECU_14',  # John Yeboah → slot 14
        'ECU_17': 'ECU_5',   # Pervis Estupiñán → slot 5
        'ECU_18': 'ECU_6',   # Willian Pacho → slot 6
        'ECU_19': 'ECU_4',   # Piero Hincapié → slot 4
        'ECU_20': 'ECU_7',   # Ángelo Preciado → slot 7
    },
    'ESP': {
        'ESP_3':  'ESP_15',  # Lamine Yamal → slot 15
        'ESP_4':  'ESP_18',  # Ferran Torres → slot 18
        'ESP_5':  'ESP_17',  # Nico Williams → slot 17
        'ESP_6':  'ESP_16',  # Dani Olmo → slot 16
        'ESP_7':  'ESP_19',  # Álvaro Morata → slot 19
        'ESP_8':  'ESP_20',  # Mikel Oyarzabal → slot 20
        'ESP_9':  'ESP_14',  # Mikel Merino → slot 14
        'ESP_10': 'ESP_12',  # Fabián Ruiz → slot 12
        'ESP_12': 'ESP_10',  # Rodri → slot 10
        'ESP_14': 'ESP_9',   # Martín Zubimendi → slot 9
        'ESP_15': 'ESP_8',   # Marc Cucurella → slot 8
        'ESP_16': 'ESP_7',   # Dani Carvajal → slot 7
        'ESP_17': 'ESP_6',   # Pedro Porro → slot 6
        'ESP_18': 'ESP_5',   # Dean Huijsen → slot 5
        'ESP_19': 'ESP_4',   # Aymeric Laporte → slot 4
        'ESP_20': 'ESP_3',   # Robin Le Normand → slot 3
    },
    'FRA': {
        'FRA_3':  'FRA_20',  # Kylian Mbappé → slot 20
        'FRA_4':  'FRA_19',  # Hugo Ekitiké → slot 19
        'FRA_5':  'FRA_18',  # Kingsley Coman → slot 18
        'FRA_6':  'FRA_17',  # Désiré Doué → slot 17
        'FRA_7':  'FRA_16',  # Bradley Barcola → slot 16
        'FRA_8':  'FRA_15',  # Ousmane Dembélé → slot 15
        'FRA_9':  'FRA_12',  # Adrien Rabiot → slot 12
        'FRA_10': 'FRA_11',  # Manu Koné → slot 11
        'FRA_11': 'FRA_10',  # Eduardo Camavinga → slot 10
        'FRA_12': 'FRA_9',   # Aurélien Tchouaméni → slot 9
        'FRA_15': 'FRA_8',   # Lucas Digne → slot 8
        'FRA_16': 'FRA_7',   # Dayot Upamecano → slot 7
        'FRA_17': 'FRA_6',   # Ibrahima Konaté → slot 6
        'FRA_18': 'FRA_5',   # Jules Koundé → slot 5
        'FRA_19': 'FRA_4',   # William Saliba → slot 4
        'FRA_20': 'FRA_3',   # Théo Hernández → slot 3
    },
    'NED': {
        'NED_3':  'NED_17',  # Memphis Depay → slot 17
        'NED_4':  'NED_18',  # Donyell Malen → slot 18
        'NED_5':  'NED_19',  # Wout Weghorst → slot 19
        'NED_6':  'NED_16',  # Justin Kluivert → slot 16
        'NED_7':  'NED_15',  # Xavi Simons → slot 15
        'NED_8':  'NED_11',  # Ryan Gravenberch → slot 11
        'NED_9':  'NED_10',  # Tijjani Reijnders → slot 10
        'NED_10': 'NED_12',  # Teun Koopmeiners → slot 12
        'NED_11': 'NED_14',  # Frenkie de Jong → slot 14
        'NED_12': 'NED_6',   # Denzel Dumfries → slot 6
        'NED_14': 'NED_9',   # Jan Paul van Hecke → slot 9
        'NED_15': 'NED_3',   # Virgil van Dijk → slot 3
        'NED_16': 'NED_4',   # Micky van de Ven → slot 4
        'NED_17': 'NED_8',   # Jeremie Frimpong → slot 8
        'NED_18': 'NED_5',   # Jurriën Timber → slot 5
        'NED_19': 'NED_7',   # Nathan Aké → slot 7
    },
    'ENG': {
        'ENG_3':  'ENG_18',  # Harry Kane → slot 18
        'ENG_4':  'ENG_19',  # Marcus Rashford → slot 19
        'ENG_5':  'ENG_16',  # Phil Foden → slot 16
        'ENG_6':  'ENG_20',  # Ollie Watkins → slot 20
        'ENG_7':  'ENG_17',  # Bukayo Saka → slot 17
        'ENG_8':  'ENG_15',  # Anthony Gordon → slot 15
        'ENG_9':  'ENG_14',  # Morgan Rogers → slot 14
        'ENG_10': 'ENG_11',  # Jude Bellingham → slot 11
        'ENG_11': 'ENG_9',   # Jordan Henderson → slot 9
        'ENG_14': 'ENG_10',  # Declan Rice → slot 10
        'ENG_15': 'ENG_8',   # Dan Burn → slot 8
        'ENG_16': 'ENG_3',   # John Stones → slot 3
        'ENG_17': 'ENG_7',   # Reece James → slot 7
        'ENG_18': 'ENG_4',   # Marc Guéhi → slot 4
        'ENG_19': 'ENG_5',   # Ezri Konsa → slot 5
        'ENG_20': 'ENG_6',   # Trent Alexander-Arnold → slot 6
    },
    'MAR': {
        'MAR_3':  'MAR_16',  # Youssef En-Nesyri → slot 16
        'MAR_4':  'MAR_17',  # Abde Ezzalzouli → slot 17
        'MAR_5':  'MAR_18',  # Soufiane Rahimi → slot 18
        'MAR_6':  'MAR_19',  # Brahim Díaz → slot 19
        'MAR_7':  'MAR_20',  # Ayoub El Kaabi → slot 20
        'MAR_8':  'MAR_10',  # Sofyan Amrabat → slot 10
        'MAR_9':  'MAR_11',  # Azzedine Ounahi → slot 11
        'MAR_10': 'MAR_12',  # Eliesse Ben Seghir → slot 12
        'MAR_11': 'MAR_14',  # Bilal El Khannous → slot 14
        'MAR_12': 'MAR_15',  # Ismaël Saibari → slot 15
        'MAR_14': 'MAR_4',   # Achraf Hakimi → slot 4
        'MAR_15': 'MAR_7',   # Romain Saïss → slot 7
        'MAR_16': 'MAR_8',   # Jawad El Yamiq → slot 8
        'MAR_17': 'MAR_3',   # Munir El Kajoui → slot 3
        'MAR_18': 'MAR_6',   # Nayef Aguerd → slot 6
        'MAR_19': 'MAR_9',   # Adam Masina → slot 9
        'MAR_20': 'MAR_5',   # Noussair Mazraoui → slot 5
    },
    'NOR': {
        'NOR_3':  'NOR_15',  # Erling Haaland → slot 15
        'NOR_4':  'NOR_18',  # Jørgen Strand Larsen → slot 18
        'NOR_5':  'NOR_16',  # Alexander Sørloth → slot 16
        'NOR_6':  'NOR_19',  # Antonio Nusa → slot 19
        'NOR_7':  'NOR_20',  # Oscar Bobb → slot 20
        'NOR_8':  'NOR_17',  # Aron Dønnum → slot 17
        'NOR_9':  'NOR_10',  # Martin Ødegaard → slot 10
        'NOR_10': 'NOR_9',   # Morten Thorsby → slot 9
        'NOR_11': 'NOR_14',  # Patrick Berg → slot 14
        'NOR_12': 'NOR_11',  # Sander Berge → slot 11
        'NOR_14': 'NOR_12',  # Andreas Schjelderup → slot 12
        'NOR_15': 'NOR_8',   # Torbjørn Heggem → slot 8
        'NOR_16': 'NOR_5',   # Kristoffer Ajer → slot 5
        'NOR_17': 'NOR_4',   # Leo Östigård → slot 4
        'NOR_18': 'NOR_7',   # David Møller Wolfe → slot 7
        'NOR_19': 'NOR_6',   # Marcus Holmgren Pedersen → slot 6
        'NOR_20': 'NOR_3',   # Julian Ryerson → slot 3
    },
    'POR': {
        'POR_3':  'POR_15',  # Cristiano Ronaldo → slot 15
        'POR_4':  'POR_17',  # João Félix → slot 17
        'POR_5':  'POR_16',  # Francisco Trincão → slot 16
        'POR_6':  'POR_14',  # João Neves → slot 14
        'POR_7':  'POR_12',  # Vitinha → slot 12
        'POR_8':  'POR_11',  # Rúben Neves → slot 11
        'POR_9':  'POR_10',  # Bruno Fernandes → slot 10
        'POR_10': 'POR_9',   # Bernardo Silva → slot 9
        'POR_11': 'POR_8',   # Gonçalo Inácio → slot 8
        'POR_12': 'POR_7',   # Nuno Mendes → slot 7
        'POR_14': 'POR_6',   # Diogo Dalot → slot 6
        'POR_15': 'POR_5',   # João Cancelo → slot 5
        'POR_16': 'POR_4',   # Rúben Dias → slot 4
        'POR_17': 'POR_3',   # José Sá → slot 3
        'POR_18': 'POR_20',  # Rafael Leão → slot 20
        'POR_20': 'POR_18',  # Gonçalo Ramos → slot 18
    },
    'URU': {
        'URU_3':  'URU_17',  # Darwin Núñez → slot 17
        'URU_4':  'URU_19',  # Rodrigo Aguirre → slot 19
        'URU_5':  'URU_20',  # Facundo Pellistri → slot 20
        'URU_6':  'URU_18',  # Federico Viñas → slot 18
        'URU_7':  'URU_11',  # Giorgian De Arrascaeta → slot 11
        'URU_8':  'URU_16',  # Maxi Araújo → slot 16
        'URU_9':  'URU_15',  # Nicolás De La Cruz → slot 15
        'URU_10': 'URU_12',  # Rodrigo Bentancur → slot 12
        'URU_11': 'URU_14',  # Manuel Ugarte → slot 14
        'URU_12': 'URU_10',  # Federico Valverde → slot 10
        'URU_14': 'URU_6',   # Sebastián Cáceres → slot 6
        'URU_15': 'URU_4',   # Ronald Araújo → slot 4
        'URU_16': 'URU_9',   # Nahitan Nández → slot 9
        'URU_17': 'URU_8',   # Guillermo Varela → slot 8
        'URU_18': 'URU_7',   # Mathías Olivera → slot 7
        'URU_19': 'URU_5',   # José María Giménez → slot 5
        'URU_20': 'URU_3',   # Santiago Mele → slot 3
    },
}


def main():
    total_renamed = 0
    total_deleted = 0
    warnings = []

    for team, renames in RENAME_MAP.items():
        team_dir = PLAYERS_DIR / team
        if not team_dir.exists():
            print(f"[SKIP] Directorio {team} no encontrado")
            continue

        print(f"\n{'='*45}")
        print(f"  {team}")
        print(f"{'='*45}")

        # Paso 1: renombrar a _tmp para evitar conflictos (skip si ya está hecho)
        for src_stem in renames:
            src = team_dir / f"{src_stem}.png"
            tmp = team_dir / f"{src_stem}_tmp.png"
            if tmp.exists():
                pass  # ya renombrado en ejecución anterior
            elif src.exists():
                src.replace(tmp)
            else:
                warnings.append(f"{team}: {src_stem}.png no encontrado")

        # Paso 2: renombrar _tmp al nombre correcto (o eliminar)
        for src_stem, dst_stem in renames.items():
            tmp = team_dir / f"{src_stem}_tmp.png"
            if not tmp.exists():
                continue

            if dst_stem == 'DELETE':
                tmp.unlink()
                print(f"  ELIMINADO: {src_stem}.png")
                total_deleted += 1
            else:
                dst = team_dir / f"{dst_stem}.png"
                tmp.replace(dst)  # replace() funciona en Windows aunque dst exista
                print(f"  {src_stem}.png  ->  {dst_stem}.png")
                total_renamed += 1

    print(f"\n{'='*45}")
    print(f"[OK] Completado: {total_renamed} renombrados, {total_deleted} eliminados")
    if warnings:
        print(f"\n[!] Advertencias ({len(warnings)}):")
        for w in warnings:
            print(f"    {w}")


if __name__ == '__main__':
    main()
