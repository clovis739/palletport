"""
Builds prisma/sample-lots.json: sample listings for the v0.8 departments (used by `npm run db:seed` and the
one-off dev.db migration). Titles and descriptions are our own; brands are demo values the owner should replace
with real stock. Run: python3 scripts/build-sample-lots.py
"""
import json, math, re

COND_RATE = {"NEW": 0.32, "SHELF_PULL": 0.26, "CUSTOMER_RETURN": 0.16, "MIXED": 0.14, "SALVAGE": 0.07}
PHRASE = {"NEW": "new, unopened", "SHELF_PULL": "shelf-pull", "CUSTOMER_RETURN": "customer-return", "MIXED": "mixed-condition", "SALVAGE": "salvage"}

def slugify(s):
    return re.sub(r"(^-|-$)", "", re.sub(r"[^a-z0-9]+", "-", s.lower()))

# (category, subcategory-suffix, title, brand, condition, size, pallets, source, available, featured, [(item, qty, msrp$)])
L = [
 # Phones & Computers
 ("phones-computers","smartphones","Unlocked Smartphones — Graded Returns","", "CUSTOMER_RETURN","CASE",1,"Online marketplace returns",3,True,[("Unlocked 128GB smartphone",14,429),("Unlocked 64GB smartphone",18,249),("Budget 32GB smartphone",20,129)]),
 ("phones-computers","laptops","Laptops & Chromebooks Mix","", "CUSTOMER_RETURN","PALLET",1,"Big-box retailer returns",2,True,[("14in laptop, 8GB/256GB",22,549),("11in Chromebook",30,229),("15.6in laptop, 16GB/512GB",12,799),("2-in-1 touchscreen laptop",8,649)]),
 ("phones-computers","tablets-e-readers","Tablets & E-readers Shelf Pulls","", "SHELF_PULL","CASE",1,"Warehouse club",3,False,[("10in tablet 64GB",24,179),("8in kids tablet with case",20,99),("6in e-reader",18,119)]),
 ("phones-computers","desktops-monitors","Monitors & Desktop PCs","", "CUSTOMER_RETURN","PALLET",1,"Big-box retailer returns",2,False,[("24in FHD monitor",30,139),("27in QHD monitor",16,279),("Compact desktop PC",10,599)]),
 ("phones-computers","computer-accessories","Keyboards, Mice & Webcams","Logitech", "SHELF_PULL","PALLET",1,"Department store overstock",3,False,[("Wireless keyboard & mouse combo",120,39),("1080p webcam",80,59),("Wireless mouse",160,24),("USB-C hub 7-in-1",90,35)]),
 # TVs
 ("tvs-home-theater","televisions","TV Truckload — 43in to 75in Returns","", "CUSTOMER_RETURN","TRUCKLOAD",22,"Big-box retailer returns",1,True,[("43in 4K smart TV",120,279),("55in 4K smart TV",140,429),("65in 4K smart TV",90,599),("75in 4K smart TV",40,899)]),
 ("tvs-home-theater","televisions","Smart TVs Pallet — 50in and Under","", "CUSTOMER_RETURN","PALLET",1,"Online marketplace returns",3,False,[("32in HD smart TV",10,169),("43in 4K smart TV",8,279),("50in 4K smart TV",6,349)]),
 ("tvs-home-theater","soundbars-home-audio","Soundbars & Home Audio","", "SHELF_PULL","PALLET",1,"Department store overstock",2,False,[("2.1 soundbar with subwoofer",40,199),("Compact soundbar",60,99),("Bookshelf speaker pair",30,149)]),
 ("tvs-home-theater","tv-mounts-accessories","TV Mounts & Cables Case Pack","", "NEW","CASE",1,"Manufacturer overstock",4,False,[("Full-motion TV wall mount",24,59),("Tilting TV mount",30,34),("HDMI 2.1 cable 6ft",100,15)]),
 # Video games
 ("video-games","consoles","Game Consoles — Tested Returns","", "CUSTOMER_RETURN","CASE",1,"Online marketplace returns",2,True,[("Current-gen home console",8,499),("Handheld hybrid console",12,299),("Previous-gen console 1TB",6,299)]),
 ("video-games","games","Video Games Overstock — Mixed Titles","", "NEW","CASE",1,"Specialty retailer",4,False,[("Current-gen game, sealed",120,59),("Previous-gen game, sealed",150,29),("Family & party game, sealed",80,39)]),
 ("video-games","controllers-accessories","Controllers & Charging Docks","", "SHELF_PULL","PALLET",1,"Big-box retailer returns",2,False,[("Wireless controller",140,64),("Dual charging dock",90,29),("Pro-style controller",40,79)]),
 ("video-games","gaming-headsets-chairs","Gaming Headsets & Chairs","", "CUSTOMER_RETURN","PALLET",2,"Online marketplace returns",2,False,[("Wireless gaming headset",60,99),("Wired gaming headset",80,49),("Gaming chair",24,229)]),
 # Electronics (new subs)
 ("electronics","cameras-drones","Cameras & Drones Returns","", "CUSTOMER_RETURN","CASE",1,"Online marketplace returns",2,False,[("4K camera drone",10,399),("Action camera",16,249),("Instant camera",20,79)]),
 ("electronics","wearables","Smartwatches & Fitness Trackers","", "SHELF_PULL","CASE",1,"Warehouse club",3,False,[("Smartwatch 44mm",20,249),("Fitness tracker band",40,79),("Kids smartwatch",16,99)]),
 # Appliances
 ("appliances","refrigerators-freezers","Refrigerators — Scratch & Dent","", "SALVAGE","TRUCKLOAD",20,"Home improvement retailer",1,True,[("French-door refrigerator",20,1899),("Top-freezer refrigerator",24,899),("Chest freezer 7cu ft",30,299)]),
 ("appliances","washers-dryers","Washers & Dryers — Customer Returns","", "CUSTOMER_RETURN","PALLET",4,"Home improvement retailer",2,False,[("Front-load washer",2,899),("Electric dryer",2,749),("Top-load washer",2,649)]),
 ("appliances","ranges-cooktops","Ranges & Cooktops Mix","", "CUSTOMER_RETURN","PALLET",3,"Home improvement retailer",1,False,[("30in electric range",2,799),("30in gas range",1,899),("Induction cooktop",4,499)]),
 ("appliances","microwaves","Microwaves Overstock","", "NEW","PALLET",1,"Manufacturer overstock",3,False,[("Countertop microwave 1.1 cu ft",24,119),("Over-the-range microwave",8,299)]),
 ("appliances","air-conditioners-heaters","Air Conditioners & Space Heaters","", "SHELF_PULL","PALLET",2,"Big-box retailer returns",2,False,[("Window air conditioner 8,000 BTU",20,299),("Portable air conditioner",10,399),("Ceramic space heater",30,49)]),
 ("appliances","vacuums-floor-care","Vacuums & Floor Care Returns","", "CUSTOMER_RETURN","PALLET",1,"Online marketplace returns",3,True,[("Cordless stick vacuum",24,229),("Robot vacuum",14,299),("Upright vacuum",10,179),("Carpet cleaner",6,199)]),
 # Home & Kitchen new subs
 ("home-kitchen","drinkware","Insulated Tumblers & Water Bottles","", "NEW","PALLET",1,"Manufacturer overstock",4,False,[("30oz insulated tumbler",240,29),("24oz insulated water bottle",200,34),("Kids 14oz tumbler",160,19)]),
 ("home-kitchen","storage-organization","Storage & Organization Overstock","", "SHELF_PULL","PALLET",1,"Department store overstock",3,False,[("Stackable storage bins 6-pack",60,39),("Closet organizer",30,79),("Drawer divider set",80,19)]),
 # Furniture
 ("furniture","bedroom-mattresses","Mattresses-in-a-Box & Bed Frames","", "NEW","PALLET",2,"Online marketplace returns",2,False,[("Queen memory foam mattress",10,399),("Full hybrid mattress",8,349),("Queen metal platform frame",12,149)]),
 # Clothing
 ("apparel","womens-clothing","Women's Clothing — Department Store Mix","", "SHELF_PULL","PALLET",1,"Department store overstock",3,True,[("Women's blouse",220,39),("Women's jeans",160,59),("Women's dress",120,69),("Women's cardigan",100,49)]),
 ("apparel","mens-clothing","Men's Clothing Overstock","", "NEW","PALLET",1,"Department store overstock",3,False,[("Men's polo shirt",240,35),("Men's chinos",140,49),("Men's quarter-zip",120,55)]),
 ("apparel","department-store-apparel","Department Store Apparel Truckload","", "SHELF_PULL","TRUCKLOAD",24,"Department store overstock",1,False,[("Mixed women's apparel",3200,34),("Mixed men's apparel",2400,32),("Mixed kids' apparel",2000,22)]),
 ("apparel","mixed-apparel","Mixed Apparel Case Pack","", "MIXED","CASE",1,"Big-box retailer returns",4,False,[("Assorted tops",60,22),("Assorted bottoms",40,30),("Assorted outerwear",12,59)]),
 # Shoes
 ("shoes","athletic-sneakers","Name-Brand Running Shoes","Nike", "SHELF_PULL","PALLET",1,"Specialty retailer",2,True,[("Men's running shoe",120,110),("Women's running shoe",120,110),("Kids' running shoe",60,65)]),
 ("shoes","womens-shoes","Women's Shoes — Flats, Heels & Sandals","", "NEW","PALLET",1,"Department store overstock",2,False,[("Women's ballet flat",90,49),("Women's block heel",60,69),("Women's sandal",100,39)]),
 ("shoes","mens-shoes","Men's Dress & Casual Shoes","", "SHELF_PULL","PALLET",1,"Department store overstock",2,False,[("Men's leather oxford",70,89),("Men's loafer",60,79),("Men's casual sneaker",90,59)]),
 ("shoes","boots","Work & Winter Boots","", "NEW","PALLET",1,"Specialty retailer",2,False,[("Men's steel-toe work boot",50,139),("Women's winter boot",70,89),("Kids' snow boot",60,49)]),
 # Accessories
 ("accessories-jewelry","handbags-wallets","Handbags & Wallets Overstock","", "NEW","CASE",1,"Department store overstock",3,True,[("Leather crossbody bag",40,89),("Tote bag",50,69),("Leather wallet",80,39)]),
 ("accessories-jewelry","watches","Fashion Watches Case Pack","", "SHELF_PULL","CASE",1,"Department store overstock",3,False,[("Men's analog watch",40,99),("Women's analog watch",40,89),("Digital sport watch",30,49)]),
 ("accessories-jewelry","jewelry","Fashion Jewelry Assortment","", "NEW","CASE",1,"Specialty retailer",4,False,[("Necklace",150,29),("Earrings",200,19),("Bracelet",150,24)]),
 ("accessories-jewelry","sunglasses","Sunglasses Display Pulls","", "SHELF_PULL","CASE",1,"Big-box retailer returns",4,False,[("Polarized sunglasses",120,29),("Sport sunglasses",80,35),("Kids' sunglasses",60,14)]),
 ("accessories-jewelry","hats-cold-weather","Hats, Gloves & Scarves","", "NEW","PALLET",1,"Department store overstock",3,False,[("Knit beanie",300,19),("Touchscreen gloves",200,22),("Scarf",150,25),("Baseball cap",200,20)]),
 # Health & Beauty new subs
 ("health-beauty","skincare","Skincare Shelf Pulls","", "SHELF_PULL","PALLET",1,"Big-box retailer returns",3,False,[("Daily moisturizer",300,18),("Facial cleanser",300,12),("Serum 1oz",200,24),("Sunscreen SPF 50",240,14)]),
 ("health-beauty","fragrance","Fragrance & Gift Sets","", "NEW","CASE",1,"Department store overstock",2,True,[("Eau de parfum 3.4oz",40,89),("Cologne 3.4oz",40,79),("Body mist gift set",60,29)]),
 ("health-beauty","bath-body","Bath & Body Overstock","", "NEW","PALLET",1,"Warehouse club",3,False,[("Body wash 18oz",400,8),("Body lotion 16oz",300,10),("Hand soap 3-pack",240,12)]),
 # Household essentials
 ("household-essentials","laundry-cleaning","Laundry Detergent & Cleaning Supplies","", "NEW","PALLET",1,"Warehouse club",4,True,[("Laundry detergent 92oz",120,16),("Multi-surface cleaner",200,5),("Dish soap 3-pack",150,9),("Dishwasher pods 60ct",100,17)]),
 ("household-essentials","paper-goods-wipes","Paper Towels, Toilet Paper & Wipes","", "NEW","PALLET",1,"Warehouse club",4,False,[("Paper towels 12-roll",60,24),("Toilet paper 24-roll",60,26),("Disinfecting wipes 3-pack",150,12)]),
 ("household-essentials","diapers-baby-care","Diapers & Baby Wipes","", "NEW","PALLET",1,"Big-box retailer returns",3,False,[("Diapers, size 3, 120ct",60,39),("Diapers, size 5, 96ct",60,39),("Baby wipes 8-pack",120,18)]),
 ("household-essentials","adult-care","Adult Care Essentials","", "NEW","PALLET",1,"Warehouse club",2,False,[("Adult briefs, large, 56ct",60,32),("Bed underpads 50ct",80,24),("Protective underwear, medium, 64ct",60,29)]),
 ("household-essentials","towels-linens","Towels & Sheet Sets","", "SHELF_PULL","PALLET",1,"Department store overstock",3,False,[("Bath towel 6-piece set",80,39),("Queen sheet set",90,49),("Hand towel 4-pack",100,19)]),
 ("household-essentials","trash-bags-food-storage","Trash Bags & Food Storage","", "NEW","PALLET",1,"Warehouse club",4,False,[("Kitchen trash bags 90ct",150,17),("Zipper storage bags 150ct",150,12),("Food containers 20-piece",80,22)]),
 # Grocery
 ("grocery-beverages","snacks-candy","Snacks & Candy — Short-Dated","", "NEW","PALLET",1,"Manufacturer overstock",3,True,[("Chips variety pack 30ct",80,19),("Granola bars 48ct",60,17),("Candy share-size bags",200,4)]),
 ("grocery-beverages","pantry-staples","Pantry Staples Pallet","", "NEW","PALLET",1,"Closeout / store closure",3,False,[("Pasta 1lb",400,2),("Canned vegetables",600,1.5),("Cereal family size",150,6),("Peanut butter 40oz",100,7)]),
 ("grocery-beverages","beverages","Sparkling Water & Soft Drinks","", "NEW","PALLET",1,"Manufacturer overstock",3,False,[("Sparkling water 12-pack",150,6),("Sports drink 12-pack",100,10),("Juice boxes 32-pack",60,12)]),
 ("grocery-beverages","coffee-tea","Coffee Pods & Tea Case Pack","", "NEW","CASE",1,"Warehouse club",4,False,[("Coffee pods 72ct",30,39),("Ground coffee 40oz",30,24),("Tea bags 100ct",40,9)]),
 ("grocery-beverages","pet-food-supplies","Pet Food & Supplies","", "SHELF_PULL","PALLET",1,"Big-box retailer returns",3,False,[("Dry dog food 30lb",20,54),("Cat litter 35lb",30,19),("Dog treats 2lb",60,15),("Pet bed",20,39)]),
 # General merchandise
 ("general-merchandise","store-returns","Big-Box Store Returns — Unsorted","", "CUSTOMER_RETURN","PALLET",1,"Big-box retailer returns",4,False,[("Assorted home goods",90,24),("Assorted electronics",40,49),("Assorted toys",60,19),("Assorted apparel",80,22)]),
 ("general-merchandise","store-returns","Online Marketplace Returns — High Piece Count","", "CUSTOMER_RETURN","PALLET",1,"Online marketplace returns",5,True,[("Small electronics & accessories",180,19),("Home & kitchen items",120,24),("Beauty & personal care",160,12),("Toys & games",90,18)]),
 ("general-merchandise","overstock-closeouts","Discount Store Closeouts","", "NEW","PALLET",1,"Closeout / store closure",4,False,[("Household basics",300,5),("Party & seasonal",200,4),("Health & beauty",200,6)]),
 ("general-merchandise","bin-store-loads","Bin Store Starter Load","", "MIXED","TRUCKLOAD",18,"Big-box retailer returns",1,False,[("Mixed general merchandise",4200,14),("Mixed small electronics",900,24),("Mixed toys",1200,16)]),
 # Toys
 ("toys-baby","ride-ons-bikes","Kids' Bikes, Scooters & Ride-ons","", "CUSTOMER_RETURN","PALLET",2,"Big-box retailer returns",2,False,[("Kids' 16in bike",10,129),("Kick scooter",24,59),("12V ride-on car",4,249)]),
 # Collectibles
 ("collectibles","trading-cards","Sealed Trading Card Boxes","", "NEW","CASE",1,"Specialty retailer",2,True,[("Sealed sports card hobby box",6,129),("Sealed blaster box",24,29),("Sealed card game booster box",8,149)]),
 ("collectibles","collectible-figures","Collectible Vinyl & Action Figures","", "NEW","CASE",1,"Specialty retailer",3,False,[("Vinyl collectible figure",120,14),("6in action figure",60,24),("Deluxe figure set",20,59)]),
 ("collectibles","die-cast-models","Die-cast Cars & Model Kits","", "NEW","CASE",1,"Manufacturer overstock",3,False,[("1:64 die-cast car",400,2),("1:24 die-cast car",40,29),("Plastic model kit",40,34)]),
 ("collectibles","memorabilia","Sports Fan Gear & Memorabilia","", "SHELF_PULL","CASE",1,"Specialty retailer",2,False,[("Team pennant",100,19),("Display case",40,29),("Fan jersey",30,89)]),
 # Sports & Outdoors
 ("sports-outdoors","fitness-equipment","Home Fitness Equipment","", "CUSTOMER_RETURN","PALLET",1,"Online marketplace returns",2,True,[("Adjustable dumbbell pair",8,299),("Yoga mat",60,29),("Resistance band set",80,24),("Folding treadmill",2,599)]),
 ("sports-outdoors","camping-hiking","Camping & Hiking Gear","", "SHELF_PULL","PALLET",1,"Specialty retailer",2,False,[("4-person tent",20,129),("Sleeping bag",30,59),("Camp chair",40,34),("Hiking backpack 40L",20,79)]),
 ("sports-outdoors","fishing","Fishing Rods, Reels & Tackle","", "NEW","PALLET",1,"Specialty retailer",2,False,[("Spinning rod & reel combo",40,59),("Baitcasting reel",20,89),("Tackle box kit",60,29)]),
 ("sports-outdoors","hunting-accessories","Hunting Accessories — Blinds, Seats & Optics","", "SHELF_PULL","PALLET",1,"Specialty retailer",1,False,[("Ground blind",10,149),("Tree stand seat",20,59),("Trail camera",30,79),("Binoculars 10x42",20,99)]),
 ("sports-outdoors","bikes-scooters","Adult Bikes & E-scooters","", "CUSTOMER_RETURN","PALLET",2,"Big-box retailer returns",1,False,[("Adult hybrid bike",6,399),("Electric scooter",10,449),("Bike helmet",30,39)]),
 ("sports-outdoors","team-sports","Team Sports Equipment","", "NEW","PALLET",1,"Closeout / store closure",2,False,[("Basketball",80,29),("Soccer ball",80,24),("Baseball glove",40,49)]),
 # Seasonal
 ("seasonal","christmas","Christmas Decor & Lights","", "NEW","PALLET",1,"Closeout / store closure",3,True,[("Artificial 6.5ft tree",10,149),("LED string lights",200,19),("Ornament set 50pc",80,24),("Inflatable yard decor",20,69)]),
 ("seasonal","halloween","Halloween Costumes & Decor","", "NEW","PALLET",1,"Closeout / store closure",2,False,[("Kids' costume",120,29),("Adult costume",80,44),("Animated yard prop",20,89)]),
 ("seasonal","summer-pool","Summer & Pool Overstock","", "NEW","PALLET",1,"Big-box retailer returns",2,False,[("Inflatable pool float",120,19),("Above-ground pool 10ft",6,199),("Beach towel",150,15)]),
 ("seasonal","back-to-school","Back-to-School Supplies","", "NEW","PALLET",1,"Manufacturer overstock",3,False,[("Backpack",80,39),("Notebook 5-pack",300,9),("Pencil & marker kit",300,8)]),
 # Tools
 ("tools-hardware","power-tools","Brand-Name Cordless Tools — 20V","DeWALT", "CUSTOMER_RETURN","PALLET",1,"Home improvement retailer",2,True,[("20V drill/driver kit",30,179),("20V impact driver",24,159),("20V circular saw",12,199),("20V 5Ah battery",40,149)]),
 ("tools-hardware","power-tools","Cordless Tools — 18V Mixed","Ryobi", "CUSTOMER_RETURN","PALLET",1,"Home improvement retailer",2,False,[("18V drill kit",30,99),("18V string trimmer",10,149),("18V leaf blower",10,129),("18V 4Ah battery",40,99)]),
 ("tools-hardware","power-tools","M18 Tool Returns","Milwaukee", "CUSTOMER_RETURN","CASE",1,"Home improvement retailer",1,False,[("M18 hammer drill",6,229),("M18 impact driver",6,199),("M18 5Ah battery",10,169)]),
 ("tools-hardware","outdoor-power-equipment","Lawn Mowers & Outdoor Power","", "CUSTOMER_RETURN","PALLET",3,"Home improvement retailer",1,False,[("21in gas push mower",6,349),("Cordless mower kit",6,449),("Gas string trimmer",10,199),("Backpack leaf blower",6,279)]),
 ("tools-hardware","tool-storage","Tool Chests & Storage","", "SHELF_PULL","PALLET",2,"Home improvement retailer",1,False,[("Rolling tool chest",6,399),("Tool box 22in",30,39),("Wall-mount storage rail kit",40,49)]),
 # Automotive
 ("automotive","parts-accessories","Auto Parts & Accessories","", "NEW","PALLET",1,"Specialty retailer",3,False,[("Brake pad set",60,49),("Air filter",120,19),("Wiper blades pair",150,24),("Floor mats set",40,59)]),
 ("automotive","wheels-tires","Tires & Wheels — New Overstock","", "NEW","PALLET",1,"Specialty retailer",2,True,[("All-season tire 17in",16,149),("All-season tire 18in",12,179),("Alloy wheel 18in",8,199)]),
 ("automotive","car-electronics","Dash Cams & Car Electronics","", "CUSTOMER_RETURN","CASE",1,"Online marketplace returns",3,False,[("Dash cam",40,89),("Car phone mount",100,24),("Portable jump starter",30,99)]),
 ("automotive","car-care","Car Care & Detailing","", "NEW","PALLET",1,"Manufacturer overstock",3,False,[("Car wash soap 64oz",150,12),("Microfiber towels 12-pack",150,14),("Tire shine spray",150,9)]),
 ("automotive","garage-shop","Garage & Shop Equipment","", "SHELF_PULL","PALLET",2,"Home improvement retailer",1,False,[("Hydraulic floor jack",10,179),("Jack stands pair",20,59),("Shop vacuum 12gal",10,99)]),
 # Warehouse & industrial
 ("warehouse-industrial","material-handling","Pallet Jacks & Hand Trucks","", "NEW","PALLET",2,"Manufacturer overstock",2,False,[("Manual pallet jack 5,500lb",4,449),("Convertible hand truck",10,189),("Platform cart",10,129)]),
 ("warehouse-industrial","shelving-racking","Steel Shelving Units","", "SHELF_PULL","PALLET",2,"Closeout / store closure",2,False,[("5-tier steel shelving 72in",20,149),("Boltless rack 48in",10,229)]),
 ("warehouse-industrial","empty-pallets","Empty 48x40 Wooden Pallets — Bundle of 20","", "MIXED","PALLET",1,"Closeout / store closure",10,False,[("Used 48x40 wooden pallet, grade A",20,12)]),
 ("warehouse-industrial","packaging-shipping-supplies","Shipping Boxes, Tape & Stretch Wrap","", "NEW","PALLET",1,"Manufacturer overstock",3,False,[("Shipping boxes 12x12x12, 25-pack",60,34),("Packing tape 6-roll",100,19),("Stretch wrap roll 18in",60,29)]),
 ("warehouse-industrial","firewood-pellets-charcoal","Wood Pellets & Charcoal","", "NEW","PALLET",1,"Manufacturer overstock",3,False,[("Hardwood pellets 40lb",50,9),("Charcoal briquettes 16lb",60,14),("Kiln-dried firewood bundle",40,8)]),
 # v0.8b: fill the remaining subcategories
 ("tvs-home-theater","projectors-streaming","Projectors & Streaming Sticks","", "CUSTOMER_RETURN","CASE",1,"Online marketplace returns",3,False,[("1080p home projector",12,199),("4K streaming stick",60,49),("Portable mini projector",16,129)]),
 ("electronics","mixed-electronics","Mixed Electronics Pallet — Untested","", "MIXED","PALLET",1,"Big-box retailer returns",4,False,[("Bluetooth speaker",40,49),("Wireless earbuds",60,39),("Smart plug",80,19),("Portable charger",60,29)]),
 ("appliances","dishwashers","Dishwashers — Scratch & Dent","", "SALVAGE","PALLET",4,"Home improvement retailer",1,False,[("24in built-in dishwasher",4,649),("Portable countertop dishwasher",4,349)]),
 ("home-kitchen","bedding-bath","Bedding & Bath Overstock","", "SHELF_PULL","PALLET",1,"Department store overstock",3,False,[("Queen comforter set",40,89),("Bath towel set",60,39),("Bath mat",80,19),("Shower curtain",80,24)]),
 ("furniture","living-room","Living Room Furniture Returns","", "CUSTOMER_RETURN","PALLET",3,"Online marketplace returns",1,False,[("Accent chair",6,249),("Coffee table",8,149),("TV stand 60in",6,199),("Side table",10,69)]),
 ("apparel","kids-clothing","Kids' Clothing — New with Tags","", "NEW","PALLET",1,"Department store overstock",3,False,[("Kids' graphic tee",300,14),("Kids' joggers",200,22),("Kids' hoodie",150,28)]),
 ("shoes","kids-shoes","Kids' Shoes Assortment","", "SHELF_PULL","PALLET",1,"Big-box retailer returns",2,False,[("Kids' sneakers",120,45),("Kids' light-up shoes",80,39),("Toddler sandals",100,24)]),
 ("shoes","sandals-slides","Sandals & Slides Closeout","", "NEW","PALLET",1,"Closeout / store closure",3,False,[("Men's slides",150,25),("Women's sandals",150,35),("Flip-flops",200,12)]),
 ("accessories-jewelry","backpacks-luggage","Backpacks & Carry-on Luggage","", "CUSTOMER_RETURN","PALLET",2,"Online marketplace returns",2,False,[("Carry-on spinner suitcase",30,129),("Checked spinner suitcase",20,169),("Laptop backpack",80,49)]),
 ("health-beauty","hair-tools","Hair Dryers, Straighteners & Hair Care","", "CUSTOMER_RETURN","PALLET",1,"Big-box retailer returns",3,False,[("Hair dryer",60,59),("Flat iron",60,49),("Curling wand",40,39),("Shampoo & conditioner set",120,14)]),
 ("general-merchandise","mystery-mix","Mystery Mix Pallet — Unmanifested Mix","", "MIXED","PALLET",1,"Big-box retailer returns",6,False,[("Assorted general merchandise (sample count)",250,15)]),
 ("toys-baby","outdoor-play","Outdoor Play — Swings, Slides & Water Toys","", "SHELF_PULL","PALLET",2,"Big-box retailer returns",2,False,[("Kids' swing set",4,249),("Toddler slide",10,69),("Water blaster 3-pack",80,19),("Sandbox with cover",8,79)]),
 ("seasonal","party-supplies","Party Supplies & Decorations","", "NEW","PALLET",1,"Closeout / store closure",4,False,[("Balloon kit",200,12),("Party tableware set",150,15),("Banner & decor pack",150,10)]),
 ("tools-hardware","lighting-electrical","Lighting & Electrical Overstock","", "NEW","PALLET",1,"Home improvement retailer",3,False,[("LED shop light 4ft",60,39),("LED bulb 4-pack",200,12),("Outdoor extension cord 50ft",60,29),("Smart light switch",60,34)]),
 ("tools-hardware","plumbing","Plumbing Fixtures & Faucets","", "SHELF_PULL","PALLET",1,"Home improvement retailer",2,False,[("Kitchen faucet with pull-down sprayer",30,149),("Bathroom faucet",40,79),("Showerhead",60,39),("Toilet seat",30,35)]),
]

def describe(i, cat_name, size, pallets, units, cond, source, manifest):
    top = sorted(manifest, key=lambda m: -m["qty"] * m["unitMsrpCents"])[:3]
    names = [f'{m["qty"]} × {m["name"]}' for m in top]
    lst = names[0] if len(names) == 1 else ", ".join(names[:-1]) + " and " + names[-1]
    u = f"{units:,}"
    c = PHRASE[cond]
    s = source.lower()
    sz = "a case pack" if size == "CASE" else (f"a {pallets}-pallet truckload" if size == "TRUCKLOAD" else (f"{pallets} pallets" if pallets > 1 else "a single pallet"))
    pack = "Ships by parcel in sealed cartons." if size == "CASE" else "Stretch-wrapped on standard 48×40 pallets."
    n = len(manifest)
    return [
        f"{u} {c} {cat_name} units packed as {sz}, sourced from {s}. The biggest lines by retail value are {lst}. All {n} manifest lines are listed below, with quantities counted at our dock. {pack}",
        f"Headline items: {lst}. This {c} {cat_name} load came in from {s} and totals {u} units across {n} manifest lines, packed as {sz}. {pack}",
        f"Sourced from {s}, this is {sz} of {c} {cat_name}: {u} units in all. Top retail lines include {lst}; the complete manifest is below. {pack}",
        f"{sz[0].upper() + sz[1:]} of {cat_name} ({c}) from {s}: {u} units over {n} manifest lines, led by {lst}. Quantities were counted at our dock. {pack}",
    ][i % 4]

CAT_NAMES = {}
import importlib.util, pathlib
tax = pathlib.Path(__file__).resolve().parent.parent / "src/lib/taxonomy.ts"
for m in re.finditer(r'cat\("([^"]+)", "([^"]+)"', tax.read_text()):
    CAT_NAMES[m.group(1)] = m.group(2)

out = []
for i, (cat, sub, title, brand, cond, size, pallets, source, avail, feat, items) in enumerate(L, 1):
    assert cat in CAT_NAMES, cat
    manifest = [{"sku": f"PP-{cat[:3].upper()}-S{i}{j}", "name": n, "qty": q, "unitMsrpCents": int(round(p * 100))} for j, (n, q, p) in enumerate(items)]
    msrp = sum(m["qty"] * m["unitMsrpCents"] for m in manifest)
    units = sum(m["qty"] for m in manifest)
    price = max(100, int(round(msrp * COND_RATE[cond] / 100)) * 100)
    t = title if size != "CASE" or "Case Pack" in title else title
    full_title = t if size != "PALLET" or pallets == 1 or "Pallet" in t else f"{t} — {pallets} Pallets"
    weight = 20 + (i * 7) % 60 if size == "CASE" else pallets * (300 + (i * 53) % 500)
    out.append({
        "slug": f"{slugify(full_title)}-s{i}",
        "title": full_title,
        "category": cat,
        "subcategory": f"{cat}-{sub}",
        "brand": brand,
        "condition": cond,
        "lotSize": size,
        "palletCount": pallets,
        "source": source,
        "available": avail,
        "featured": feat,
        "priceCents": price,
        "msrpCents": msrp,
        "units": units,
        "weightLbs": weight,
        "daysAgo": (i * 5) % 21,
        "views": (i * 97) % 700,
        "description": describe(i, CAT_NAMES[cat].lower(), size, pallets, units, cond, source, manifest),
        "manifest": manifest,
    })

p = pathlib.Path(__file__).resolve().parent.parent / "prisma/sample-lots.json"
p.write_text(json.dumps(out, indent=1, ensure_ascii=False) + "\n")
print(f"{len(out)} sample lots → {p}")
