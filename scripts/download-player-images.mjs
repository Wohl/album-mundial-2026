// Album Mundial 2026 — Player image downloader (v2)
// Source: Wikipedia + Wikimedia Commons (open licenses)
// Usage: node scripts/download-player-images.mjs [TEAM_CODE] [--force]
//   --force  re-download and re-crop even if file already exists
// Example: node scripts/download-player-images.mjs MEX --force

import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const sharp = require('sharp');

const ROOT = process.cwd();
const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const TEAM_FILTER = args.find(a => !a.startsWith('--'))?.toUpperCase();
const USER_AGENT = 'AlbumMundial2026/1.0 (personal/educational project)';

// Output portrait: 240×320 (3:4) with attention-based crop (centers on face)
const TARGET_W = 240;
const TARGET_H = 320;
const MIN_SRC_W = 100; // reject source images narrower than this (icons, tiny thumbs)

// ── 48 Teams × 20 players ────────────────────────────────────────────────────
// idx 0 = Escudo (badge/foil) — NO image
// idx 12 = Foto Equipo (team photo) — NO image
const TEAMS = [
  { code: 'MEX', players: ['Escudo México','Luis Malagón','Johan Vásquez','Jorge Sánchez','Cesar Montes','Jesús Gallardo','Israel Reyes','Diego Lainez','Carlos Rodríguez','Edson Álvarez','Orbelin Pineda','Marcel Ruiz','Foto Equipo','Érick Sánchez','Hirving Lozano','Santiago Giménez','Raúl Jiménez','Alexis Vega','Roberto Alvarado','Cesar Huerta'] },
  { code: 'RSA', players: ['Escudo Sudáfrica','Ronwen Williams','Sipho Chaine','Aubrey Modiba','Samukele Kabini','Mbekezeli Mbokazi','Khulumani Ndamane','Siyabonga Ngezana','Khuliso Mudau','Nkosinathi Sibisi','Teboho Mokoena','Thalente Mbatha','Foto Equipo','Bathabile Aubaas','Yaya Sithole','Sipho Mbule','Lyle Foster','Iqraam Rayners','Mohau Nkota','Oswin Appollis'] },
  { code: 'KOR', players: ['Escudo Rep. de Corea','Hyeon-woo Jo','Seung-gyu Kim','Min-jae Kim','Yu-min Cho','Young-woo Seol','Han-beom Lee','Tae-seok Lee','Myung-jae Lee','Jae-sung Lee','In-beom Hwang','Kang-in Lee','Foto Equipo','Seung-ho Paik','Jens Castrop','Dong-yeong Lee','Gue-sung Cho','Son Heung-min','Hee-chan Hwang','Hyeon-gyu Oh'] },
  { code: 'CZE', players: ['Escudo Czechia','Matěj Kovář','Jindřich Staněk','Ladislav Krejčí','Vladimír Coufal','Jaroslav Zelený','Tomáš Holeš','David Zima','Michal Sadílek','Lukáš Provod','Lukáš Červ','Tomáš Souček','Foto Equipo','Pavel Šulc','Matěj Vydra','Vasil Kušej','Tomáš Chorý','Václav Černý','Adam Hložek','Patrik Schick'] },
  { code: 'CAN', players: ['Escudo Canadá','Dayne St. Clair','Alphonso Davies','Alistair Johnston','Samuel Adekugbe','Richie Laryea','Derek Cornelius','Moïse Bombito','Kamal Miller','Stephen Eustáquio','Ismaël Koné','Jonathan Osorio','Foto Equipo','Jacob Shaffelburg','Mathieu Choinière','Niko Sigur','Tajon Buchanan','Liam Millar','Cyle Larin','Jonathan David'] },
  { code: 'BIH', players: ['Escudo Bosnia','Nikola Vasilj','Amer Dedić','Sead Kolašinac','Tarik Muharemović','Nihad Mujakić','Nikola Katić','Amir Hadžiahmetović','Benjamin Tahirović','Armin Gigović','Ivan Šunjić','Ivan Bašić','Foto Equipo','Dženis Burnić','Esmir Bajraktarević','Amar Memić','Ermedin Demirović','Edin Džeko','Samed Baždar','Haris Tabakovic'] },
  { code: 'QAT', players: ['Escudo Qatar','Meshaal Barsham','Sultan Al-Brake','Lucas Mendes','Homam Ahmed','Boualem Khoukhi','Pedro Miguel','Tarek Salman','Mohamed Al-Mannai','Karim Boudiaf','Assim Madibo','Ahmed Fatehi','Foto Equipo','Mohammed Waad','Abdulaziz Hatem','Hassan Al-Haydos','Edmilson Júnior','Akram Hassan Afif','Ahmed Al-Ghanei','Almoez Ali'] },
  { code: 'SUI', players: ['Escudo Suiza','Gregor Kobel','Yvon Mvogo','Manuel Akanji','Ricardo Rodríguez','Nico Elvedi','Aurèle Amenda','Silvan Widmer','Granit Xhaka','Denis Zakaria','Remo Freuler','Fabian Rieder','Foto Equipo','Ardon Jashari','Johan Manzambi','Michel Aebischer','Breel Embolo','Ruben Vargas','Dan Ndoye','Zeki Amdouni'] },
  { code: 'BRA', players: ['Escudo Brasil','Alisson Becker','Bento','Marquinhos','Éder Militão','Gabriel Magalhães','Danilo','Wesley','Lucas Paquetá','Casemiro','Bruno Guimarães','Luiz Henrique','Foto Equipo','Vinícius Jr','Rodrygo','João Pedro','Matheus Cunha','Gabriel Martinelli','Raphinha','Estévão'] },
  { code: 'MAR', players: ['Escudo Marruecos','Yassine Bounou','Munir El Kajoui','Achraf Hakimi','Noussair Mazraoui','Nayef Aguerd','Romain Saïss','Jawad El Yamiq','Adam Masina','Sofyan Amrabat','Azzedine Ounahi','Eliesse Ben Seghir','Foto Equipo','Bilal El Khannous','Ismaël Saibari','Youssef En-Nesyri','Abde Ezzalzouli','Soufiane Rahimi','Brahim Díaz','Ayoub El Kaabi'] },
  { code: 'HAI', players: ['Escudo Haití','Johny Placide','Carlens Arcus','Martin Expérience','Jean-Kevin Duverne','Ricardo Adé','Duke Lacroix','Garven Metusala','Hannes Delcroix','Leverton Pierre','Danley Jean Jacques','Jean-Ricner Bellegarde','Foto Equipo','Christopher Attys','Derrick Etienne Jr','Josue Casimir','Ruben Providence','Duckens Nazon','Louicius Deedson','Frantzdy Pierrot'] },
  { code: 'SCO', players: ['Escudo Escocia','Angus Gunn','Jack Hendry','Kieran Tierney','Aaron Hickey','Andrew Robertson','Scott McKenna','John Souttar','Anthony Ralston','Grant Hanley','Scott McTominay','Billy Gilmour','Foto Equipo','Lewis Ferguson','Ryan Christie','Kenny McLean','John McGinn','Lyndon Dykes','Che Adams','Ben Doak'] },
  { code: 'USA', players: ['Escudo USA','Matt Freese','Chris Richards','Tim Ream','Mark McKenzie','Alex Freeman','Antonee Robinson','Tyler Adams','Tanner Tessmann','Weston McKennie','Christian Roldan','Timothy Weah','Foto Equipo','Diego Luna','Malik Tillman','Christian Pulisic','Brenden Aaronson','Ricardo Pepi','Haji Wright','Folarin Balogun'] },
  { code: 'PAR', players: ['Escudo Paraguay','Roberto Fernández','Orlando Gill','Gustavo Gómez','Fabián Balbuena','Juan José Cáceres','Omar Alderete','Junior Alonso','Mathías Villasanti','Diego Gómez','Damián Bobadilla','Andrés Cubas','Foto Equipo','Matías Galarza','Julio Enciso','Alejandro Romero Gamarra','Miguel Almirón','Ramón Sosa','Ángel Romero','Antonio Sanabria'] },
  { code: 'AUS', players: ['Escudo Australia','Mathew Ryan','Joe Gauci','Harry Souttar','Alessandro Circati','Jordan Bos','Aziz Behich','Cameron Burgess','Lewis Miller','Milos Degenek','Jackson Irvine','Riley McGree','Foto Equipo',"Aiden O'Neill",'Connor Metcalfe','Patrick Yazbek','Craig Goodwin','Kusini Yengi','Nestory Irankunda','Mohamed Touré'] },
  { code: 'TUR', players: ['Escudo Turquía','Uğurcan Çakır','Mert Müldür','Zeki Çelik','Abdülkerim Bardakcı','Çağlar Söyüncü','Merih Demiral','Ferdi Kadıoğlu','Kaan Ayhan','İsmail Yüksek','Hakan Çalhanoğlu','Orkun Kökcü','Foto Equipo','Arda Güler','İrfan Can Kahveci','Yunus Akgün','Can Uzun','Barış Alper Yılmaz','Kerem Aktürkoğlu','Kenan Yıldız'] },
  { code: 'GER', players: ['Escudo Alemania','Marc-André ter Stegen','Jonathan Tah','David Raum','Nico Schlotterbeck','Antonio Rüdiger','Waldemar Anton','Ridle Baku','Maximilian Mittelstädt','Joshua Kimmich','Florian Wirtz','Felix Nmecha','Foto Equipo','Leon Goretzka','Jamal Musiala','Serge Gnabry','Kai Havertz','Leroy Sané','Karim Adeyemi','Nick Woltemade'] },
  { code: 'CUW', players: ['Escudo Curazao','Eloy Room','Armando Obispo','Sherel Floranus','Jurién Gaari','Joshua Brenet','Roshon Van Eijma','Shurandy Sambo','Livano Comenencia','Godfried Roemeratoe','Juninho Bacuna','Leandro Bacuna','Foto Equipo','Tahith Chong','Kenji Gorre','Jearl Margaritha','Jurgen Locadia','Jeremy Antonisse','Gervane Kastaneer','Sontje Hansen'] },
  { code: 'CIV', players: ['Escudo Costa de Marfil','Yahia Fofana','Ghislain Konan','Wilfried Singo','Odilon Kossounou',"Evan N'Dicka",'Willy Boly','Emmanuel Agbadou','Ousmane Diomandé','Franck Kessié','Seko Fofana','Ibrahim Sangaré','Foto Equipo','Jean-Philippe Gbamin','Amad Diallo','Sébastien Haller','Simon Adingra','Yan Diomandé','Evann Guessand','Oumar Diakité'] },
  { code: 'ECU', players: ['Escudo Ecuador','Hernán Galíndez','Gonzalo Valle','Piero Hincapié','Pervis Estupiñán','Willian Pacho','Ángelo Preciado','Joel Ordóñez','Moisés Caicedo','Alan Franco','Kendry Páez','Pedro Vite','Foto Equipo','John Yeboah','Leonardo Campana','Gonzalo Plata','Nilson Angulo','Alan Minda','Kevin Rodríguez','Enner Valencia'] },
  { code: 'NED', players: ['Escudo Países Bajos','Bart Verbruggen','Virgil van Dijk','Micky van de Ven','Jurriën Timber','Denzel Dumfries','Nathan Aké','Jeremie Frimpong','Jan Paul van Hecke','Tijjani Reijnders','Ryan Gravenberch','Teun Koopmeiners','Foto Equipo','Frenkie de Jong','Xavi Simons','Justin Kluivert','Memphis Depay','Donyell Malen','Wout Weghorst','Cody Gakpo'] },
  { code: 'JPN', players: ['Escudo Japón','Zion Suzuki','Hiroki Mochizuki','Ayumu Seko','Junnosuke Suzuki','Shogo Taniguchi','Tsuyoshi Watanabe','Kaishu Sano','Yuki Soma','Ao Tanaka','Daichi Kamada','Takefusa Kubo','Foto Equipo','Ritsu Doan','Keito Nakamura','Takumi Minamino','Shuto Machino','Junya Ito','Koki Ogawa','Ayase Ueda'] },
  { code: 'SWE', players: ['Escudo Suecia','Victor Johansson','Isak Hien','Gabriel Gudmundsson','Emil Holm','Victor Nilsson Lindelöf','Gustaf Lagerbielke','Lucas Bergvall','Hugo Larsson','Jesper Karlström','Yasin Ayari','Mattias Svanberg','Foto Equipo','Daniel Svensson','Ken Sema','Roony Bardghji','Dejan Kulusevski','Anthony Elanga','Alexander Isak','Viktor Gyökeres'] },
  { code: 'TUN', players: ['Escudo Túnez','Béchir Ben Said','Aymen Dahmen','Yan Valery','Montassar Talbi','Yassine Meriah','Ali Abdi','Dylan Bronn','Ellyes Skhiri','Aïssa Laïdouni','Ferjani Sassi','Mohamed Ali Ben Romdhane','Foto Equipo','Hannibal Mejbri','Elias Achouri','Elias Saad','Hazem Mastouri','Ismaël Gharbi','Sayfallah Ltaief','Naïm Sliti'] },
  { code: 'BEL', players: ['Escudo Bélgica','Thibaut Courtois','Arthur Theate','Timothy Castagne','Zeno Debast','Brandon Mechele','Maxim De Cuyper','Thomas Meunier','Youri Tielemans','Amadou Onana','Nicolas Raskin','Alexis Saelemaekers','Foto Equipo','Hans Vanaken','Kevin De Bruyne','Jérémy Doku','Charles De Ketelaere','Leandro Trossard','Loïs Openda','Romelu Lukaku'] },
  { code: 'EGY', players: ['Escudo Egipto','Mohamed El-Shenawy','Mohamed Hany','Mohamed Hamdy','Yasser Ibrahim','Khaled Sobhi','Ramy Rabia','Hossam Abdelmaguid','Ahmed Fatouh','Marwan Attia','Zizo','Hamdy Fathi','Foto Equipo','Mohamed Lasheen','Emam Ashour','Osama Faisal','Mohamed Salah','Mostafa Mohamed','Trézéguet','Omar Marmoush'] },
  { code: 'IRN', players: ['Escudo Irán','Alireza Beiranvand','Morteza Pouraliganji','Ehsan Hajsafi','Milad Mohammadi','Shoja Khalilzadeh','Ramin Rezaeian','Hossein Kanaani','Sadegh Moharrami','Saleh Hardani','Saeed Ezatolahi','Saman Ghoddos','Foto Equipo','Omid Noorafkan','Roozbeh Cheshmi','Mohammad Mohebi','Sardar Azmoun','Mehdi Taremi','Alireza Jahanbakhsh','Ali Gholizadeh'] },
  { code: 'NZL', players: ['Escudo Nueva Zelanda','Max Crocombe','Alex Paulsen','Michael Boxall','Liberato Cacace','Tim Payne','Tyler Bindon','Francis de Vries','Finn Surman','Joe Bell','Sarpreet Singh','Ryan Thomas','Foto Equipo','Matthew Garbett','Marko Stamenić','Ben Old','Chris Wood','Elijah Just','Callum McCowatt','Kosta Barbarouses'] },
  { code: 'ESP', players: ['Escudo España','Unai Simón','Robin Le Normand','Aymeric Laporte','Dean Huijsen','Pedro Porro','Dani Carvajal','Marc Cucurella','Martín Zubimendi','Rodri','Pedri','Fabián Ruiz','Foto Equipo','Mikel Merino','Lamine Yamal','Dani Olmo','Nico Williams','Ferran Torres','Álvaro Morata','Mikel Oyarzabal'] },
  { code: 'CPV', players: ['Escudo Cabo Verde','Vozinha','Logan Costa','Pico','Diney','Steven Moreira','Wagner Pina','João Paulo','Yannick Semedo','Kevin Pina','Patrick Andrade','Jamiro Monteiro','Foto Equipo','Deroy Duarte','Garry Rodrigues','Jovane Cabral','Ryan Mendes','Dailon Livramento','Willy Semedo','Bebé'] },
  { code: 'KSA', players: ['Escudo Arabia Saudí','Nawaf Al-Aqidi','Abdulrahman Al-Sanbi','Saud Abdulhamid','Nawaf Bulayhi','Jihad Thakri','Moteb Al-Harbi','Hassan Al-Tambakti','Musab Al-Juwayr','Ziyad Al-Johani','Abdullah Al-Khaibari','Nasser Al-Dawsari','Foto Equipo','Saleh Abu Al-Shamat','Marwan Al-Sahafi','Salem Al-Dawsari','Abdulrahman Al-Aboud','Feras Albrikan','Saleh Al-Shehri','Abdullah Al-Hamdan'] },
  { code: 'URU', players: ['Escudo Uruguay','Sergio Rochet','Santiago Mele','Ronald Araújo','José María Giménez','Sebastián Cáceres','Mathías Olivera','Guillermo Varela','Nahitan Nández','Federico Valverde','Giorgian De Arrascaeta','Rodrigo Bentancur','Foto Equipo','Manuel Ugarte','Nicolás De La Cruz','Maxi Araújo','Darwin Núñez','Federico Viñas','Rodrigo Aguirre','Facundo Pellistri'] },
  { code: 'FRA', players: ['Escudo Francia','Mike Maignan','Théo Hernández','William Saliba','Jules Koundé','Ibrahima Konaté','Dayot Upamecano','Lucas Digne','Aurélien Tchouaméni','Eduardo Camavinga','Manu Koné','Adrien Rabiot','Foto Equipo','Michael Olise','Ousmane Dembélé','Bradley Barcola','Désiré Doué','Kingsley Coman','Hugo Ekitike','Kylian Mbappé'] },
  { code: 'SEN', players: ['Escudo Senegal','Édouard Mendy','Yehvann Diouf','Moussa Niakhaté','Abdoulaye Seck','Ismail Jakobs','El Hadji Malick Diouf','Kalidou Koulibaly','Idrissa Gana Gueye','Pape Matar Sarr','Pape Gueye','Habib Diarra','Foto Equipo','Lamine Camara','Sadio Mané','Ismaïla Sarr','Boulaye Dia','Iliman Ndiaye','Nicolas Jackson','Krepin Diatta'] },
  { code: 'IRQ', players: ['Escudo Iraq','Jalal Hassan','Rebin Sulaka','Hussein Ali','Akam Hashem','Merchas Doski','Zaid Tahseen','Manaf Younis','Zidane Iqbal','Amir Al-Ammari','Ibrahim Bayesh','Ali Jasim','Foto Equipo','Youssef Amyn','Aimar Sher','Marko Farji','Osama Rashid','Ali Al-Hamadi','Aymen Hussein','Mohanad Ali'] },
  { code: 'NOR', players: ['Escudo Noruega','Ørjan Nyland','Julian Ryerson','Leo Östigård','Kristoffer Ajer','Marcus Holmgren Pedersen','David Møller Wolfe','Torbjørn Heggem','Morten Thorsby','Martin Ødegaard','Sander Berge','Andreas Schjelderup','Foto Equipo','Patrick Berg','Erling Haaland','Alexander Sørloth','Aron Dønnum','Jørgen Strand Larsen','Antonio Nusa','Oscar Bobb'] },
  { code: 'ARG', players: ['Escudo Argentina','Emiliano Martínez','Nahuel Molina','Cristian Romero','Nicolás Otamendi','Nicolás Tagliafico','Leonardo Balerdi','Enzo Fernández','Alexis Mac Allister','Rodrigo De Paul','Exequiel Palacios','Leandro Paredes','Foto Equipo','Nico Paz','Franco Mastantuono','Nicolás González','Lionel Messi','Lautaro Martínez','Julián Álvarez','Giuliano Simeone'] },
  { code: 'ALG', players: ['Escudo Argelia','Alexis Guendouz','Ramy Bensebaini','Youcef Atal','Rayan Aït-Nouri','Mohamed Amine Tougai','Aïssa Mandi','Ismaël Bennacer','Hossem Aouar','Hicham Boudaoui','Ramiz Zerrouki','Nabil Bentaleb','Foto Equipo','Farès Chaïbi','Riyad Mahrez','Saïd Benrahma','Anis Hadj Moussa','Amine Gouiri','Baghdad Bounedjah','Mohammed Amoura'] },
  { code: 'AUT', players: ['Escudo Austria','Alexander Schlager','Patrick Pentz','David Alaba','Kevin Danso','Philipp Lienhart','Stefan Posch','Philipp Mwene','Alexander Prass','Xaver Schlager','Marcel Sabitzer','Konrad Laimer','Foto Equipo','Florian Grillitsch','Nicolas Seiwald','Romano Schmid','Patrick Wimmer','Christoph Baumgartner','Michael Gregoritsch','Marko Arnautović'] },
  { code: 'JOR', players: ['Escudo Jordania','Yazeed Abulaila','Ihsan Haddad','Mohammad Abu Hashish','Yazan Al-Arab','Abdallah Nasib','Saleem Obaid','Mohammad Abualnadi','Ibrahim Saadeh','Nizar Al-Rashdan','Noor Al-Rawabdeh','Mohannad Abu Taha','Foto Equipo','Amer Jamous','Musa Al-Taamari','Yazan Al-Naimat','Mahmoud Al-Mardi','Ali Olwan','Mohammad Abu Zrayq','Ibrahim Sabra'] },
  { code: 'POR', players: ['Escudo Portugal','Diogo Costa','José Sá','Rúben Dias','João Cancelo','Diogo Dalot','Nuno Mendes','Gonçalo Inácio','Bernardo Silva','Bruno Fernandes','Rúben Neves','Vitinha','Foto Equipo','João Neves','Cristiano Ronaldo','Francisco Trincão','João Félix','Gonçalo Ramos','Pedro Neto','Rafael Leão'] },
  { code: 'COD', players: ['Escudo Congo DR','Lionel Mpasi','Aaron Wan-Bissaka','Axel Tuanzebe','Arthur Masuaku','Chancel Mbemba','Joris Kayembe','Charles Pickel',"Ngal'ayel Mukau",'Edo Kayembe','Samuel Moutoussamy','Noah Sadiki','Foto Equipo','Théo Bongonda','Meschak Elia','Yoane Wissa','Brian Cipenga','Fiston Mayele','Cédric Bakambu','Nathanaël Mbuku'] },
  { code: 'UZB', players: ['Escudo Uzbekistán','Utkir Yusupov','Farrukh Sayfiev','Sherzod Nasrullaev','Umar Eshmurodov','Husniddin Aliqulov','Rustamjon Ashurmatov','Khojiakbar Alijonov','Abdukodir Khusanov','Odiljon Hamrobekov','Otabek Shukurov','Jamshid Iskanderov','Foto Equipo','Azizbek Turgunboev','Khojimat Erkinov','Eldor Shomurodov','Oston Urunov','Jaloliddin Masharipov','Igor Sergeev','Abbosbek Fayzullaev'] },
  { code: 'COL', players: ['Escudo Colombia','Camilo Vargas','David Ospina','Dávinson Sánchez','Yerry Mina','Daniel Muñoz','Johan Mojica','Jhon Lucumí','Santiago Arias','Jefferson Lerma','Kevin Castaño','Richard Ríos','Foto Equipo','James Rodríguez','Juan Fernando Quintero','Jorge Carrascal','Jon Arias','Jhon Córdoba','Luis Suárez','Luis Díaz'] },
  { code: 'ENG', players: ['Escudo Inglaterra','Jordan Pickford','John Stones','Marc Guéhi','Ezri Konsa','Trent Alexander-Arnold','Reece James','Dan Burn','Jordan Henderson','Declan Rice','Jude Bellingham','Cole Palmer','Foto Equipo','Morgan Rogers','Anthony Gordon','Phil Foden','Bukayo Saka','Harry Kane','Marcus Rashford','Ollie Watkins'] },
  { code: 'CRO', players: ['Escudo Croacia','Dominik Livaković','Duje Ćaleta-Car','Joško Gvardiol','Josip Stanišić','Luka Vušković','Josip Šutalo','Kristijan Jakić','Luka Modrić','Mateo Kovačić','Martin Baturina','Lovro Majer','Foto Equipo','Mario Pašalić','Petar Sučić','Ivan Perišić','Marco Pašalić','Ante Budimir','Andrej Kramarić','Franjo Ivanović'] },
  { code: 'GHA', players: ['Escudo Ghana','Lawrence Ati-Zigi','Tariq Lamptey','Mohammed Salisu','Alidu Seidu','Alexander Djiku','Gideon Mensah','Caleb Yirenkyi','Abdul Fatawu Issahaku','Thomas Partey','Salis Abdul Samed','Kamaldeen Sulemana','Foto Equipo','Mohammed Kudus','Iñaki Williams','Jordan Ayew','André Ayew','Joseph Paintsil','Osman Bukari','Antoine Semenyo'] },
  { code: 'PAN', players: ['Escudo Panamá','Orlando Mosquera','Luis Mejía','Fidel Escobar','Andrés Andrade','Amir Murillo','Eric Davis','José Córdoba','César Blackman','Cristian Martínez','Aníbal Godoy','Adalberto Carrasquilla','Foto Equipo','Édgar Bárcenas','Carlos Harvey','Ismael Díaz','José Fajardo','Cecilio Waterman','José Luis Rodríguez','Alberto Quintero'] },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function cleanName(name) {
  return name.replace(/✦/g, '').replace(/\s+/g, ' ').trim();
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function fetchRetry(url, options = {}, maxRetries = 5) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch(url, options);
    if (res.status !== 429) return res;
    const retryAfter = parseInt(res.headers.get('retry-after') ?? '0', 10);
    const wait = retryAfter > 0 ? retryAfter * 1000 : Math.pow(2, attempt + 1) * 2000;
    await sleep(wait);
  }
  throw new Error(`Still rate-limited after ${maxRetries} retries: ${url}`);
}

// Get page image filename from Wikipedia, then fetch it from Commons at 400px
async function tryWikiLarge(title, lang = 'en') {
  const metaUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&format=json&formatversion=2`;
  try {
    const metaRes = await fetchRetry(metaUrl, { headers: { 'User-Agent': USER_AGENT } });
    if (!metaRes.ok) return null;
    const metaData = await metaRes.json();
    const page = (metaData.query?.pages ?? [])[0];
    const filename = page?.pageimage;
    if (!filename) return null;

    const commonsUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(filename)}&prop=imageinfo&iiprop=url&iiurlwidth=400&format=json&formatversion=2`;
    const commonsRes = await fetchRetry(commonsUrl, { headers: { 'User-Agent': USER_AGENT } });
    if (!commonsRes.ok) return null;
    const commonsData = await commonsRes.json();
    const filePage = (commonsData.query?.pages ?? [])[0];
    return filePage?.imageinfo?.[0]?.thumburl ?? null;
  } catch { return null; }
}

// Fallback: Wikipedia REST summary thumbnail (smaller but safe)
async function tryWikiSummary(playerName, lang = 'en') {
  const slug = encodeURIComponent(playerName.replace(/ /g, '_'));
  const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${slug}`;
  try {
    const res = await fetchRetry(url, { headers: { 'User-Agent': USER_AGENT } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.thumbnail?.source ?? null;
  } catch { return null; }
}

// Search Wikipedia → return first result title
async function searchWiki(playerName, lang = 'en') {
  const q = encodeURIComponent(`${playerName} footballer`);
  const url = `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${q}&format=json&formatversion=2&srlimit=1`;
  try {
    const res = await fetchRetry(url, { headers: { 'User-Agent': USER_AGENT } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.query?.search?.[0]?.title ?? null;
  } catch { return null; }
}

async function getWikipediaImage(playerName) {
  const slug = playerName.replace(/ /g, '_');

  // 1. EN Wikipedia direct → Commons 400px
  const enLarge = await tryWikiLarge(slug, 'en');
  if (enLarge) return enLarge;

  // 2. ES Wikipedia direct → Commons 400px
  const esLarge = await tryWikiLarge(slug, 'es');
  if (esLarge) return esLarge;

  // 3. EN search → large
  const enTitle = await searchWiki(playerName, 'en');
  if (enTitle) {
    const enSearchLarge = await tryWikiLarge(enTitle, 'en');
    if (enSearchLarge) return enSearchLarge;
    // fallback to REST summary thumbnail for this title
    const enSummary = await tryWikiSummary(enTitle, 'en');
    if (enSummary) return enSummary;
  }

  // 4. ES search → large
  const esTitle = await searchWiki(playerName, 'es');
  if (esTitle) {
    const esSearchLarge = await tryWikiLarge(esTitle, 'es');
    if (esSearchLarge) return esSearchLarge;
    const esSummary = await tryWikiSummary(esTitle, 'es');
    if (esSummary) return esSummary;
  }

  return null;
}

// Download raw bytes to disk
async function downloadRaw(url, filepath) {
  const res = await fetchRetry(url, {
    headers: { 'User-Agent': USER_AGENT, 'Referer': 'https://en.wikipedia.org/' },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buffer = await res.arrayBuffer();
  fs.writeFileSync(filepath, Buffer.from(buffer));
}

// Post-process: validate dimensions then smart-crop to portrait 240×320
async function processImage(filepath) {
  const meta = await sharp(filepath).metadata();
  if (!meta.width || meta.width < MIN_SRC_W) {
    fs.unlinkSync(filepath);
    throw new Error(`Source too small: ${meta.width ?? '?'}×${meta.height ?? '?'}px — discarded`);
  }
  const buf = await sharp(filepath)
    .resize(TARGET_W, TARGET_H, {
      fit: 'cover',
      position: 'attention', // libvips attention: centres crop on face/salient region
    })
    .png({ compressionLevel: 8 })
    .toBuffer();
  fs.writeFileSync(filepath, buf);
}

async function downloadAndProcess(url, filepath, displayKey) {
  await downloadRaw(url, filepath);
  await processImage(filepath);
}

// Bounded concurrency worker pool
async function runConcurrent(tasks, limit) {
  const results = new Array(tasks.length);
  let next = 0;
  async function worker() {
    while (next < tasks.length) {
      const i = next++;
      results[i] = await tasks[i]();
    }
  }
  await Promise.allSettled(Array.from({ length: Math.min(limit, tasks.length) }, worker));
  return results;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const teamsToProcess = TEAM_FILTER
    ? TEAMS.filter(t => t.code === TEAM_FILTER)
    : TEAMS;

  if (teamsToProcess.length === 0) {
    console.error(`Unknown team: ${TEAM_FILTER}. Valid: ${TEAMS.map(t => t.code).join(', ')}`);
    process.exit(1);
  }

  const pending = [];
  let skipped = 0;

  for (const team of teamsToProcess) {
    const dir = path.join(ROOT, 'public', 'players', team.code);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    for (let i = 0; i < 20; i++) {
      if (i === 0 || i === 12) continue;
      const playerName = cleanName(team.players[i]);
      const displayKey = `${team.code}_${i + 1}`;
      const filepath = path.join(dir, `${displayKey}.png`);

      if (!FORCE && fs.existsSync(filepath)) { skipped++; continue; }
      pending.push({ playerName, displayKey, filepath });
    }
  }

  console.log(`\nAlbum Mundial 2026 — Image downloader v2`);
  console.log(`Teams : ${teamsToProcess.map(t => t.code).join(', ')}`);
  console.log(`Mode  : ${FORCE ? 'FORCE (re-download all)' : 'incremental'}`);
  console.log(`Crop  : ${TARGET_W}×${TARGET_H}px attention-based portrait`);
  console.log(`Queue : ${pending.length} players  (${skipped} skipped)\n`);

  if (pending.length === 0) { console.log('Nothing to do.'); return; }

  // Phase 1: parallel URL lookup (4 concurrent)
  console.log('Looking up image URLs (Wikipedia + Commons)...');
  const lookupTasks = pending.map(p => async () => {
    const imgUrl = await getWikipediaImage(p.playerName);
    if (!imgUrl) console.log(`  ✗  ${p.playerName.padEnd(30)} (no image found)`);
    return { ...p, imgUrl };
  });
  const resolved = await runConcurrent(lookupTasks, 4);

  const toDownload = resolved.filter(r => r.imgUrl);
  const notFound = resolved.filter(r => !r.imgUrl).length;

  // Phase 2: serial download + sharp processing (avoid rate limiting)
  console.log(`\nDownloading & cropping ${toDownload.length} images...\n`);
  let downloaded = 0, errors = 0;

  for (const { playerName, displayKey, filepath, imgUrl } of toDownload) {
    try {
      await downloadAndProcess(imgUrl, filepath, displayKey);
      console.log(`  ✓  ${playerName.padEnd(30)} → ${displayKey}.png`);
      downloaded++;
    } catch (e) {
      console.error(`  !  ${playerName.padEnd(30)} ${e.message}`);
      errors++;
    }
    await sleep(300);
  }

  console.log(`\n═══════════════════════════`);
  console.log(`✓  Downloaded : ${downloaded}`);
  console.log(`✗  Not found  : ${notFound}`);
  console.log(`!  Errors     : ${errors}`);
  console.log(`○  Skipped    : ${skipped}`);
  console.log(`═══════════════════════════\n`);
}

main().catch(err => { console.error(err); process.exit(1); });
