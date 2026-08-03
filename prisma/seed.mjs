import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const NA = "North America";

const rows = [
  // Canada
  { region: NA, subregion: "Canada", hos: "Canada Sales Lead", docp: "Canada DOCP", team: "Canada - Auto", sellerName: "Corey Roberts", marketTeam: "AUTO", rhoCs: "Suzy Lawlor", csManager: "Annie O'Brien", csmName: "Kate Newell" },
  { region: NA, subregion: "Canada", hos: "Canada Sales Lead", docp: "Canada DOCP", team: "Canada - CPG", sellerName: "Oscar Gallo", marketTeam: "CPG2", rhoCs: "Suzy Lawlor", csManager: "Ingrid Rosaeg", csmName: "Nia Lewis" },
  { region: NA, subregion: "Canada", hos: "Canada Sales Lead", docp: "Canada DOCP", team: "Canada - Tech", sellerName: "Kevin De Las Alas", marketTeam: "TECH", rhoCs: "Suzy Lawlor", csManager: "Ingrid Rosaeg", csmName: "Ravi Khot" },
  { region: NA, subregion: "Canada", hos: "Canada Sales Lead", docp: "Canada DOCP", team: "Canada - Finance", sellerName: "Chad Beamish", marketTeam: "FIN", rhoCs: "Suzy Lawlor", csManager: "Ingrid Rosaeg", csmName: "Emma Korbs" },
  { region: NA, subregion: "Canada", hos: "Canada Sales Lead", docp: "Canada DOCP", team: "Canada - QSR", sellerName: "Dave Di Santo", marketTeam: "QSR", rhoCs: "Suzy Lawlor", csManager: "Ingrid Rosaeg", csmName: "Emma Korbs" },
  { region: NA, subregion: "Canada", hos: "Canada Sales Lead", docp: "Canada DOCP", team: "Canada - Retail", sellerName: "Dean Shoukas", marketTeam: "RETAIL", rhoCs: "Suzy Lawlor", csManager: "Ingrid Rosaeg", csmName: "Simmy Sidhu" },
  { region: NA, subregion: "Canada", hos: "Canada Sales Lead", docp: "Canada DOCP", team: "Canada - Entertainment", sellerName: "Lisa Chwastiak", marketTeam: "ENT", rhoCs: "Suzy Lawlor", csManager: "Annie O'Brien", csmName: "Bria Akomah" },
  { region: NA, subregion: "Canada", hos: "Canada Sales Lead", docp: "Canada DOCP", team: "Canada - CPG", sellerName: "Mike Lillie", marketTeam: "CPG", rhoCs: "Suzy Lawlor", csManager: "Ingrid Rosaeg", csmName: "Miles Baker" },
  // US - Apps & Gaming
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Nichole Delansky", team: "US - Apps & Gaming", sellerName: "Brandon Hale", marketTeam: "APP2", rhoCs: "Drew Lewis", csManager: "Sara Liberman", csmName: "Musu Bangura" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Nichole Delansky", team: "US - Apps & Gaming", sellerName: "Dennis Tie", marketTeam: "APP3", rhoCs: "Drew Lewis", csManager: "Sara Liberman", csmName: "Cristina Espinoza" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Nichole Delansky", team: "US - Apps & Gaming", sellerName: "John Curran", marketTeam: "APP4", rhoCs: "Drew Lewis", csManager: "Sara Liberman", csmName: "Michelle Venditto" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Nichole Delansky", team: "US - Apps & Gaming", sellerName: "Lauren Reynolds", marketTeam: "APP1", rhoCs: "Drew Lewis", csManager: "Sara Liberman", csmName: "Brian Aria" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Nichole Delansky", team: "US - Apps & Gaming", sellerName: "Michael McCurdy", marketTeam: "APP5", rhoCs: "Drew Lewis", csManager: "Sara Liberman", csmName: "Nick Ibanez" },
  // US - Entertainment
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Sabrina Sarnoff", team: "US - Entertainment", sellerName: "Cristina Fankhauser", marketTeam: "ENT1", rhoCs: "Drew Lewis", csManager: "Sara Dixon", csmName: "Dana Smith" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Sabrina Sarnoff", team: "US - Entertainment", sellerName: "Erin Albertson", marketTeam: "ENT2", rhoCs: "Drew Lewis", csManager: "Sara Dixon", csmName: "Alice Liggett" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Sabrina Sarnoff", team: "US - Entertainment", sellerName: "Garron Markey", marketTeam: "ENT3", rhoCs: "Drew Lewis", csManager: "Sara Dixon", csmName: "Amanda Ruland" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Sabrina Sarnoff", team: "US - Entertainment", sellerName: "Jennifer Chan", marketTeam: "ENT4", rhoCs: "Drew Lewis", csManager: "Sara Dixon", csmName: "Jimmy Sanderson" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Sabrina Sarnoff", team: "US - Entertainment", sellerName: "Lauren Hammerson", marketTeam: "ENT5", rhoCs: "Drew Lewis", csManager: "Sara Dixon", csmName: "Michelle Lee" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Sabrina Sarnoff", team: "US - Entertainment", sellerName: "Nick Stilwell", marketTeam: "ENT6", rhoCs: "Drew Lewis", csManager: "Sara Dixon", csmName: "Jonathan Vu" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Sabrina Sarnoff", team: "US - Entertainment", sellerName: "Jordan Ungar", marketTeam: "ENT7", rhoCs: "Drew Lewis", csManager: "Sara Dixon", csmName: "Holly Massey" },
  // US - Tech 1
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Tom Henry", team: "US Vertical - Tech 1", sellerName: "Anna Badalian", marketTeam: "TECH1", rhoCs: "Drew Lewis", csManager: "Matt Landes", csmName: "Chi Nguyen" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Tom Henry", team: "US Vertical - Tech 1", sellerName: "Anna Harper", marketTeam: "TECH2", rhoCs: "Drew Lewis", csManager: "Matt Landes", csmName: "Grace Mintz", secondCsm: "Valentina Polacco" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Tom Henry", team: "US Vertical - Tech 1", sellerName: "Chase Fowler", marketTeam: "TECH3", rhoCs: "Drew Lewis", csManager: "Matt Landes", csmName: "Stephanie Lo Ceperich", secondCsm: "Katherine Bowens" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Tom Henry", team: "US Vertical - Tech 1", sellerName: "Iggy Lentini", marketTeam: "TECH4", rhoCs: "Drew Lewis", csManager: "Matt Landes", csmName: "Rachel Woo" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Tom Henry", team: "US Vertical - Tech 1", sellerName: "Jess DeBolt Berman", marketTeam: "TECH5", rhoCs: "Drew Lewis", csManager: "Matt Landes", csmName: "Griffin Lane" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Tom Henry", team: "US Vertical - Tech 1", sellerName: "Whitney Page", marketTeam: "TECH6", rhoCs: "Drew Lewis", csManager: "Matt Landes", csmName: "Stefan Banks" },
  // US - Tech 2
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Rich Lawrence", team: "US Vertical - Tech 2", sellerName: "Lena Lei", marketTeam: "TECH7", rhoCs: "Drew Lewis", csManager: "Sara Liberman", csmName: "Esther Lim", secondCsm: "Valentina Polacco" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Rich Lawrence", team: "US Vertical - Tech 2", sellerName: "Amanda Charlwood", marketTeam: "TECH8", rhoCs: "Drew Lewis", csManager: "Sara Liberman", csmName: "Rachel Gallop" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Rich Lawrence", team: "US Vertical - Tech 2", sellerName: "Jehan Tudugalla", marketTeam: "TECH9", rhoCs: "Drew Lewis", csManager: "Sara Liberman", csmName: "Joanna Kim" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Rich Lawrence", team: "US Vertical - Tech 2", sellerName: "Lenore Shickmanter", marketTeam: "TECH10", rhoCs: "Drew Lewis", csManager: "Sara Liberman", csmName: "Naomi Faust" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Rich Lawrence", team: "US Vertical - Tech 2", sellerName: "Paul Van Dellen", marketTeam: "TECH11", rhoCs: "Drew Lewis", csManager: "Sara Liberman", csmName: "Esther Lim" },
  // US - Telco & Mobility
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Brendan O'Donnell", team: "US - Telco & Mobility", sellerName: "Christine Leung", marketTeam: "TELCO1", rhoCs: "Drew Lewis", csManager: "Kate Grabinski", csmName: "Ali Cerza" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Brendan O'Donnell", team: "US - Telco & Mobility", sellerName: "Diana Nardolilli", marketTeam: "TELCO2", rhoCs: "Drew Lewis", csManager: "Kate Grabinski", csmName: "Danielle Bischoff" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Brendan O'Donnell", team: "US - Telco & Mobility", sellerName: "Jon Widawsky", marketTeam: "TELCO3", rhoCs: "Drew Lewis", csManager: "Kate Grabinski", csmName: "Danielle Bischoff" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Brendan O'Donnell", team: "US - Telco & Mobility", sellerName: "Lauren Laffey", marketTeam: "TELCO4", rhoCs: "Drew Lewis", csManager: "Kate Grabinski", csmName: "Alex Alomar" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Brendan O'Donnell", team: "US - Telco & Mobility", sellerName: "Maggie Bloom", marketTeam: "TELCO5", rhoCs: "Drew Lewis", csManager: "Kate Grabinski", csmName: "Emily Kelberman" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Brendan O'Donnell", team: "US - Telco & Mobility", sellerName: "Matthew Pik", marketTeam: "TELCO6", rhoCs: "Drew Lewis", csManager: "Kate Grabinski", csmName: "Varick Tecson" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Brendan O'Donnell", team: "US - Telco & Mobility", sellerName: "Meredith Nissen", marketTeam: "TELCO7", rhoCs: "Drew Lewis", csManager: "Kate Grabinski", csmName: "Emily Crump" },
  // US - CPG Beverages
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Zach Rosenow", team: "US - CPG Beverages", sellerName: "Chelsea Medina", marketTeam: "BEV1", rhoCs: "Nick Willis", csManager: "Shannon O'Neill", csmName: "Molly Norman" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Zach Rosenow", team: "US - CPG Beverages", sellerName: "Drew Bottone", marketTeam: "BEV2", rhoCs: "Nick Willis", csManager: "Shannon O'Neill", csmName: "Meghana Srinivasan" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Zach Rosenow", team: "US - CPG Beverages", sellerName: "Greg Warren", marketTeam: "BEV3", rhoCs: "Nick Willis", csManager: "Shannon O'Neill", csmName: "Clara Toft-Nielsen" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Zach Rosenow", team: "US - CPG Beverages", sellerName: "Jessica Rohls", marketTeam: "BEV4", rhoCs: "Nick Willis", csManager: "Shannon O'Neill", csmName: "Ali Haase" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Zach Rosenow", team: "US - CPG Beverages", sellerName: "Hannah Carmondy", marketTeam: "BEV5", rhoCs: "Nick Willis", csManager: "Shannon O'Neill", csmName: "Courtney Johnson" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Zach Rosenow", team: "US - CPG Beverages", sellerName: "Skye Leff", marketTeam: "BEV6", rhoCs: "Nick Willis", csManager: "Shannon O'Neill", csmName: "Nia Lewis" },
  // US - CPG Food
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Shayne Koch", team: "US - CPG Food", sellerName: "Allison Casper", marketTeam: "FOOD1", rhoCs: "Nick Willis", csManager: "Shannon O'Neill", csmName: "Meghana Srinivasan" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Shayne Koch", team: "US - CPG Food", sellerName: "Marcella Lavras", marketTeam: "FOOD7", rhoCs: "Nick Willis", csManager: "Shannon O'Neill", csmName: "Clara Toft-Nielsen" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Shayne Koch", team: "US - CPG Food", sellerName: "Liv Biordi", marketTeam: "FOOD2", rhoCs: "Nick Willis", csManager: "Shannon O'Neill", csmName: "Hillary Martel" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Shayne Koch", team: "US - CPG Food", sellerName: "Ferris Salameh", marketTeam: "FOOD3", rhoCs: "Nick Willis", csManager: "Shannon O'Neill", csmName: "Mike Moen" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Shayne Koch", team: "US - CPG Food", sellerName: "Jessica Claus", marketTeam: "FOOD5", rhoCs: "Nick Willis", csManager: "Shannon O'Neill", csmName: "Kristin Ramsey" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Shayne Koch", team: "US - CPG Food", sellerName: "Marisa Kaye", marketTeam: "FOOD4", rhoCs: "Nick Willis", csManager: "Shannon O'Neill", csmName: "Danielle Wilson" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Shayne Koch", team: "US - CPG Food", sellerName: "Randi Boublis", marketTeam: "FOOD6", rhoCs: "Nick Willis", csManager: "Shannon O'Neill", csmName: "Samantha Applebaum" },
  // US - Health 1
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Marianne Swift", team: "US - Health 1", sellerName: "Matthew Buese", marketTeam: "HEALTH1", rhoCs: "Nick Willis", csManager: "Harry Gaffney", csmName: "Kayla Tourville" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Marianne Swift", team: "US - Health 1", sellerName: "Sara Hecht", marketTeam: "HEALTH2", rhoCs: "Nick Willis", csManager: "Harry Gaffney", csmName: "Stephanie Ellicott" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Marianne Swift", team: "US - Health 1", sellerName: "Casey Shingledecker", marketTeam: "HEALTH3", rhoCs: "Nick Willis", csManager: "Harry Gaffney", csmName: "Allie Hasselt" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Marianne Swift", team: "US - Health 1", sellerName: "Jacquie Sabatini", marketTeam: "HEALTH4", rhoCs: "Nick Willis", csManager: "Harry Gaffney", csmName: "Taylor Shapiro" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Marianne Swift", team: "US - Health 1", sellerName: "Laura Baranowski", marketTeam: "HEALTH5", rhoCs: "Nick Willis", csManager: "Harry Gaffney", csmName: "Kayla Tourville" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Marianne Swift", team: "US - Health 1", sellerName: "Kala Ingardona", marketTeam: "HEALTH6", rhoCs: "Nick Willis", csManager: "Harry Gaffney", csmName: "Katie Hollemans" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Marianne Swift", team: "US - Health 1", sellerName: "Sam Agate", marketTeam: "HEALTH7", rhoCs: "Nick Willis", csManager: "Harry Gaffney", csmName: "Katie Hollemans" },
  // US - Health 2
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Sarah LaRocca", team: "US - Health 2", sellerName: "Julia Simons", marketTeam: "HEALTH8", rhoCs: "Nick Willis", csManager: "Harry Gaffney", csmName: "Pamela Shapiro" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Sarah LaRocca", team: "US - Health 2", sellerName: "Keely Herring", marketTeam: "HEALTH9", rhoCs: "Nick Willis", csManager: "Harry Gaffney", csmName: "Ryan Heeley" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Sarah LaRocca", team: "US - Health 2", sellerName: "Jane Brennan", marketTeam: "HEALTH10", rhoCs: "Nick Willis", csManager: "Harry Gaffney", csmName: "Peter Megahan" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Sarah LaRocca", team: "US - Health 2", sellerName: "Mikayla Cullum", marketTeam: "HEALTH11", rhoCs: "Nick Willis", csManager: "Harry Gaffney", csmName: "Ryan Heeley" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Sarah LaRocca", team: "US - Health 2", sellerName: "Becca Marcus", marketTeam: "HEALTH12", rhoCs: "Nick Willis", csManager: "Harry Gaffney", csmName: "Peter Megahan" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Sarah LaRocca", team: "US - Health 2", sellerName: "Jordana Kassimir", marketTeam: "RET8", rhoCs: "Nick Willis", csManager: "Harry Gaffney", csmName: "Chris Iverson" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Sarah LaRocca", team: "US - Health 2", sellerName: "Shayna Socia", marketTeam: "RET11", rhoCs: "Nick Willis", csManager: "Harry Gaffney", csmName: "Chris Iverson" },
  // US - Retail 1
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Marel Pitter", team: "US - Retail 1", sellerName: "Jaime Wheeler", marketTeam: "RET1", rhoCs: "Nick Willis", csManager: "Marcy Dougherty", csmName: "Katie Thornton" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Marel Pitter", team: "US - Retail 1", sellerName: "Katherine Langon", marketTeam: "RET2", rhoCs: "Nick Willis", csManager: "Marcy Dougherty", csmName: "Nathina McDuffie-Zach" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Marel Pitter", team: "US - Retail 1", sellerName: "Rachael Davidson", marketTeam: "RET2", rhoCs: "Nick Willis", csManager: "Marcy Dougherty", csmName: "Nathina McDuffie-Zach" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Marel Pitter", team: "US - Retail 1", sellerName: "Kathleen Chu Cheong", marketTeam: "RET3", rhoCs: "Nick Willis", csManager: "Marcy Dougherty", csmName: "Desiree Oreta" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Marel Pitter", team: "US - Retail 1", sellerName: "Kaye Dolan", marketTeam: "RET4", rhoCs: "Nick Willis", csManager: "Marcy Dougherty", csmName: "Linda Han" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Marel Pitter", team: "US - Retail 1", sellerName: "Tyler VanderValk", marketTeam: "RET5", rhoCs: "Nick Willis", csManager: "Marcy Dougherty", csmName: "Antonia Palazzo" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Marel Pitter", team: "US - Retail 1", sellerName: "Catherine Kelly", marketTeam: "RET6", rhoCs: "Nick Willis", csManager: "Marcy Dougherty", csmName: "Mallory Rynish" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Marel Pitter", team: "US - Retail 1", sellerName: "Phil Taylor", marketTeam: "RET7", rhoCs: "Nick Willis", csManager: "Marcy Dougherty", csmName: "Helen Germanos" },
  // US - Retail 2/3
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Michelle Rosenthal", team: "US - Retail 2/3", sellerName: "Kyle Speckman", marketTeam: "RET8", rhoCs: "Nick Willis", csManager: "Teresa Blahnik", csmName: "Chandler Reagan" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Michelle Rosenthal", team: "US - Retail 2/3", sellerName: "Nicole Wilder", marketTeam: "RET9", rhoCs: "Nick Willis", csManager: "Teresa Blahnik", csmName: "Kimmi Cecchi" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Michelle Rosenthal", team: "US - Retail 2/3", sellerName: "Dayna Mendez", marketTeam: "RET10", rhoCs: "Nick Willis", csManager: "Teresa Blahnik", csmName: "Brianna Fishel" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Michelle Rosenthal", team: "US - Retail 2/3", sellerName: "Eddie Pesina", marketTeam: "RET11", rhoCs: "Nick Willis", csManager: "Teresa Blahnik", csmName: "Natalie Picker" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Michelle Rosenthal", team: "US - Retail 2/3", sellerName: "Erin Morrison", marketTeam: "RET12", rhoCs: "Nick Willis", csManager: "Teresa Blahnik", csmName: "Laura Superina" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Michelle Rosenthal", team: "US - Retail 2/3", sellerName: "Holly Hollins", marketTeam: "RET13", rhoCs: "Nick Willis", csManager: "Teresa Blahnik", csmName: "Kyle Joyce" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Michelle Rosenthal", team: "US - Retail 2/3", sellerName: "Sarah Egeland", marketTeam: "RET14", rhoCs: "Nick Willis", csManager: "Teresa Blahnik", csmName: "AJ Ali" },
  // US - Auto
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Greg Myrick", team: "US - Auto", sellerName: "Chelsea White", marketTeam: "AUTO1", rhoCs: "Suzy Lawlor", csManager: "Annie O'Brien", csmName: "Christina Inchuachan" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Greg Myrick", team: "US - Auto", sellerName: "Jane Hahn", marketTeam: "AUTO2", rhoCs: "Suzy Lawlor", csManager: "Annie O'Brien", csmName: "Robin Newquist" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Greg Myrick", team: "US - Auto", sellerName: "Jen Bowers", marketTeam: "AUTO3", rhoCs: "Suzy Lawlor", csManager: "Annie O'Brien", csmName: "Miles Baker" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Greg Myrick", team: "US - Auto", sellerName: "John Byrne", marketTeam: "AUTO4", rhoCs: "Suzy Lawlor", csManager: "Annie O'Brien", csmName: "Robin Newquist" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Greg Myrick", team: "US - Auto", sellerName: "Kyle Holtsinger", marketTeam: "AUTO5", rhoCs: "Suzy Lawlor", csManager: "Annie O'Brien", csmName: "Joshua Sheynkman" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Greg Myrick", team: "US - Auto", sellerName: "Tim Gattshall", marketTeam: "AUTO6", rhoCs: "Suzy Lawlor", csManager: "Annie O'Brien", csmName: "Sheryl Good" },
  // US - Fin 1
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Liz Song", team: "US - Finance 1", sellerName: "Liz Song", marketTeam: "FIN1", rhoCs: "Suzy Lawlor", csManager: "Jennifer Hill", csmName: "Sarah Vallis" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Liz Song", team: "US - Finance 1", sellerName: "Rachel Wohlfeld", marketTeam: "FIN2", rhoCs: "Suzy Lawlor", csManager: "Jennifer Hill", csmName: "Sarah Vallis" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Liz Song", team: "US - Finance 1", sellerName: "Erin Sellecchia", marketTeam: "FIN3", rhoCs: "Suzy Lawlor", csManager: "Jennifer Hill", csmName: "Jenny Pedriani" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Liz Song", team: "US - Finance 1", sellerName: "Kaitlin Drexler", marketTeam: "FIN4", rhoCs: "Suzy Lawlor", csManager: "Jennifer Hill", csmName: "Danny Miller" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Liz Song", team: "US - Finance 1", sellerName: "McKinley Imus", marketTeam: "FIN5", rhoCs: "Suzy Lawlor", csManager: "Jennifer Hill", csmName: "Andre Baez" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Liz Song", team: "US - Finance 1", sellerName: "Nicole Purcell", marketTeam: "FIN6", rhoCs: "Suzy Lawlor", csManager: "Jennifer Hill", csmName: "Jack Lundy" },
  // US - Fin 2
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Renaldo Davis", team: "US - Finance 2", sellerName: "Gracie Armendariz", marketTeam: "FIN7", rhoCs: "Suzy Lawlor", csManager: "Megan Rivas", csmName: "Nicole Vega" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Renaldo Davis", team: "US - Finance 2", sellerName: "Tahlin Harris", marketTeam: "FIN8", rhoCs: "Suzy Lawlor", csManager: "Megan Rivas", csmName: "Kim Williams" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Renaldo Davis", team: "US - Finance 2", sellerName: "Jon Wren", marketTeam: "FIN9", rhoCs: "Suzy Lawlor", csManager: "Megan Rivas", csmName: "Jon Glauber" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Renaldo Davis", team: "US - Finance 2", sellerName: "Michael Mahler", marketTeam: "FIN10", rhoCs: "Suzy Lawlor", csManager: "Megan Rivas", csmName: "Jon Glauber" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Renaldo Davis", team: "US - Finance 2", sellerName: "Sara Walker", marketTeam: "FIN11", rhoCs: "Suzy Lawlor", csManager: "Megan Rivas", csmName: "Regan Brown" },
  // US - QSR
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Matt Badcock", team: "US - QSR", sellerName: "Adam Davis", marketTeam: "QSR1", rhoCs: "Suzy Lawlor", csManager: "Nick Salazer", csmName: "Chelsea Kanduth" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Matt Badcock", team: "US - QSR", sellerName: "Ben Morton", marketTeam: "QSR2", rhoCs: "Suzy Lawlor", csManager: "Nick Salazer", csmName: "Leah Calpin" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Matt Badcock", team: "US - QSR", sellerName: "Caroline Piscopo Nelson", marketTeam: "QSR3", rhoCs: "Suzy Lawlor", csManager: "Nick Salazer", csmName: "John Allen" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Matt Badcock", team: "US - QSR", sellerName: "Christopher Stewart", marketTeam: "QSR4", rhoCs: "Suzy Lawlor", csManager: "Nick Salazer", csmName: "Briana McGowan" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Matt Badcock", team: "US - QSR", sellerName: "Juba Bektache", marketTeam: "QSR5", rhoCs: "Suzy Lawlor", csManager: "Nick Salazer", csmName: "Rebecca Shoch" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Matt Badcock", team: "US - QSR", sellerName: "Marty Zelenko", marketTeam: "QSR6", rhoCs: "Suzy Lawlor", csManager: "Nick Salazer", csmName: "Scott Waywood" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Matt Badcock", team: "US - QSR", sellerName: "Jack Murphy", marketTeam: "QSR7", rhoCs: "Suzy Lawlor", csManager: "Nick Salazer", csmName: "Leah Calpin" },
  // US - Travel & Gov
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Melanie Russo", team: "US - Travel & Gov", sellerName: "Allison DePorter", marketTeam: "TRA/GOV1", rhoCs: "Suzy Lawlor", csManager: "Jordan Goggins", csmName: "Sam Mattfolk" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Melanie Russo", team: "US - Travel & Gov", sellerName: "Brennan Chamberlin", marketTeam: "TRA/GOV2", rhoCs: "Suzy Lawlor", csManager: "Jordan Goggins", csmName: "Ashley Spraggins" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Melanie Russo", team: "US - Travel & Gov", sellerName: "Lauren Dana", marketTeam: "TRA/GOV3", rhoCs: "Suzy Lawlor", csManager: "Jordan Goggins", csmName: "Jacqui Rodgers" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Melanie Russo", team: "US - Travel & Gov", sellerName: "Lauren Podolsky", marketTeam: "TRA/GOV4", rhoCs: "Suzy Lawlor", csManager: "Jordan Goggins", csmName: "Ashlee Richardson" },
  { region: NA, subregion: "United States", hos: "US Sales Lead", docp: "Melanie Russo", team: "US - Travel & Gov", sellerName: "Mike White", marketTeam: "TRA/GOV5", rhoCs: "Suzy Lawlor", csManager: "Jordan Goggins", csmName: "Bridget Finnigan" },
];

async function main() {
  const client = await pool.connect();
  try {
    console.log("Clearing existing SalesAlignment data...");
    await client.query('DELETE FROM "SalesAlignment"');

    console.log(`Seeding ${rows.length} alignment rows...`);
    const query = `INSERT INTO "SalesAlignment" (id, region, subregion, hos, docp, team, "sellerName", "marketTeam", location, "rhoCs", "csManager", "csmName", "secondCsm", "cpContractor", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())`;

    for (const row of rows) {
      await client.query(query, [
        row.region,
        row.subregion,
        row.hos,
        row.docp,
        row.team,
        row.sellerName,
        row.marketTeam,
        null,
        row.rhoCs,
        row.csManager,
        row.csmName,
        row.secondCsm || null,
        null,
      ]);
    }

    const result = await client.query('SELECT COUNT(*) FROM "SalesAlignment"');
    console.log(`Done. ${result.rows[0].count} alignment rows seeded.`);

    // Seed AdminItems
    console.log("Seeding admin items...");
    await client.query('DELETE FROM "AdminItem"');

    // Get or create a system user for seeding
    let adminUser = await client.query('SELECT id FROM "User" WHERE "isAdmin" = true LIMIT 1');
    let adminId;
    if (adminUser.rows.length > 0) {
      adminId = adminUser.rows[0].id;
    } else {
      // Make the first user an admin
      const firstUser = await client.query('SELECT id FROM "User" LIMIT 1');
      if (firstUser.rows.length > 0) {
        adminId = firstUser.rows[0].id;
        await client.query('UPDATE "User" SET "isAdmin" = true WHERE id = $1', [adminId]);
        console.log("Made first user an admin for seeding.");
      } else {
        console.log("No users found — skipping admin items and saved items.");
        return;
      }
    }

    const now = new Date();
    function daysFromNow(d) { const dt = new Date(now); dt.setDate(dt.getDate() + d); return dt.toISOString(); }

    const adminItems = [
      { title: "Q3 Time-Spent Survey", description: "Complete the quarterly time-spent survey. Required for all CSMs.", date: daysFromNow(3), itemType: "deadline", category: "surveys", priority: "urgent" },
      { title: "Training Americas: New Dashboard Features", description: "Walk-through of new dashboard capabilities and reporting tools.", date: daysFromNow(7), itemType: "training", category: "meetings", priority: "normal" },
      { title: "ACN Survey Window Opens", description: "ACN survey window is now open. Complete by end of window.", date: daysFromNow(14), itemType: "survey", category: "surveys", priority: "normal" },
      { title: "Mid-Year Feedback Window", description: "Submit mid-year feedback for your direct reports and peers.", date: daysFromNow(5), itemType: "deadline", category: "surveys", priority: "high" },
      { title: "Measurement Enablement Cohort 4 Kickoff", description: "Kickoff session for the 4th measurement enablement cohort.", date: daysFromNow(14), itemType: "training", category: "programs", priority: "normal" },
      { title: "All-Hands: Ad Sales QBR", description: "Quarterly business review for Americas ad sales.", date: daysFromNow(21), itemType: "all-hands", category: "meetings", priority: "normal" },
      { title: "Programming Days: Q3 Planning", description: "Dedicated planning days for Q3 programming initiatives.", date: daysFromNow(7), itemType: "deadline", category: "programs", priority: "high" },
      { title: "New: Audience Insights 2.0", description: "Audience Insights 2.0 is now live with enhanced demographic and behavioral data.", date: daysFromNow(2), itemType: "new-release", category: "announcements", priority: "normal" },
      { title: "Deprecation: Legacy Campaign Reporter", description: "Legacy Campaign Reporter will be sunset. Migrate to new reporting dashboard.", date: daysFromNow(30), itemType: "deprecation", category: "announcements", priority: "high" },
      { title: "New: Real-Time Pacing Dashboard", description: "Real-time campaign pacing is now available in the new dashboard.", date: daysFromNow(14), itemType: "new-release", category: "announcements", priority: "normal" },
      { title: "Deprecation: Old Targeting Interface", description: "The old targeting interface will be removed. Use the new Audience Builder.", date: daysFromNow(45), itemType: "deprecation", category: "announcements", priority: "normal" },
      { title: "Americas CSM Weekly Sync", description: "Weekly sync for all Americas CSMs. Agenda shared in Slack.", date: daysFromNow(1), itemType: "training", category: "meetings", priority: "normal", isRecurring: true, recurrencePattern: "weekly" },
      { title: "Training: Ad Analytics Certification", description: "Complete the Ad Analytics certification program.", date: daysFromNow(21), itemType: "training", category: "meetings", priority: "normal" },
      { title: "Campaign Deadline: Q3 Mid-Flight Reviews", description: "All Q3 campaigns must have mid-flight reviews completed.", date: daysFromNow(10), itemType: "deadline", category: "campaigns", priority: "high" },
      { title: "All-Hands: Product Roadmap Preview", description: "Preview of upcoming product features and roadmap for H2.", date: daysFromNow(30), itemType: "all-hands", category: "meetings", priority: "normal" },
    ];

    const adminQuery = `INSERT INTO "AdminItem" (id, "createdById", title, description, date, "endDate", "itemType", category, priority, link, "isRecurring", "recurrencePattern", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), $1, $2, $3, $4, NULL, $5, $6, $7, NULL, $8, $9, NOW(), NOW())`;

    for (const item of adminItems) {
      await client.query(adminQuery, [
        adminId,
        item.title,
        item.description,
        item.date,
        item.itemType,
        item.category,
        item.priority,
        item.isRecurring ?? false,
        item.recurrencePattern ?? null,
      ]);
    }
    console.log(`${adminItems.length} admin items seeded.`);

    // Seed sample SavedItems
    console.log("Seeding sample saved items...");
    await client.query('DELETE FROM "SavedItem"');

    const savedQuery = `INSERT INTO "SavedItem" (id, "userId", "sourceType", "sourceId", title, content, "sourceUrl", tags, notes, "isArchived", "savedAt")
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, false, NOW())`;

    await client.query(savedQuery, [
      adminId,
      "slack",
      "slack-sample-1",
      "Targeting best practices for Tech vertical",
      "Hey team, here are the updated targeting best practices for Tech accounts:\n\n1. Use Audience Insights 2.0 for demographic overlap\n2. Layer contextual targeting with behavioral segments\n3. Always include a frequency cap of 3x/week for awareness campaigns\n4. For consideration campaigns, use the new interest-based segments\n\nLet me know if you have questions!",
      null,
      "{follow-up,reference}",
      "Good reference for onboarding new Tech CSMs",
    ]);

    await client.query(savedQuery, [
      adminId,
      "slack",
      "slack-sample-2",
      "Campaign pacing issue — solution found",
      "For anyone hitting the pacing issue with Q3 campaigns: the fix is to go into Campaign Settings > Delivery > and toggle \"Smart Pacing\" off and back on. This resets the delivery algorithm. Engineering is aware and a permanent fix is in the next release.\n\nAlso make sure your flight dates don't overlap with any paused line items — that's been causing the budget allocation to get stuck.",
      null,
      "{solution-found,urgent}",
      "Share with team if they hit this issue",
    ]);

    await client.query(savedQuery, [
      adminId,
      "slack",
      "slack-sample-3",
      "Q3 survey response template",
      "Here's the template I use for the Q3 time-spent survey responses. Feel free to adapt:\n\n- Client meetings: 40%\n- Campaign management: 25%\n- Internal sync/planning: 15%\n- Training/enablement: 10%\n- Admin/other: 10%\n\nMake sure your percentages add up to 100!",
      null,
      "{reference}",
      null,
    ]);

    console.log("3 sample saved items seeded.");

  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
