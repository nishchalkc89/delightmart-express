// Delight store taxonomy and the rules that sort products into it.
// Rules are checked top to bottom against the lower-cased product name; the first match wins.
// Order matters: specific brands/product types come before broad words (e.g. "baby shampoo" before "shampoo").

export const CATEGORIES = [
  { slug: 'groceries', name: 'Groceries & Staples', description: 'Daily Essentials' },
  { slug: 'snacks', name: 'Snacks & Sweets', description: 'Biscuits, Chips & Chocolates' },
  { slug: 'beverages', name: 'Beverages', description: 'Tea, Coffee, Juice & Drinks' },
  { slug: 'dairy-frozen', name: 'Dairy, Bakery & Frozen', description: 'Fresh & Chilled' },
  { slug: 'beauty-skincare', name: 'Beauty & Personal Care', description: 'Look Good, Feel Good' },
  { slug: 'health-hygiene', name: 'Health & Hygiene', description: 'Care for You & Family' },
  { slug: 'baby-care', name: 'Baby Care', description: 'For Your Little Ones' },
  { slug: 'cleaning', name: 'Cleaning & Laundry', description: 'Clean Home, Happy Home' },
  { slug: 'kitchen-household', name: 'Kitchen & Dining', description: 'Make Home Better' },
  { slug: 'home-living', name: 'Home & Living', description: 'Storage, Decor & Utility' },
  { slug: 'stationery', name: 'Stationery & School', description: 'Study Made Easy' },
  { slug: 'toys', name: 'Toys, Games & Sports', description: 'Play & Learn' },
  { slug: 'ladies-wear', name: 'Fashion & Accessories', description: 'Trendy Fashion' },
  { slug: 'electronics', name: 'Electronics & Appliances', description: 'Smart Living' },
  { slug: 'gifts-puja', name: 'Gifts, Puja & Festive', description: 'Celebrate Every Moment' },
  { slug: 'pet-care', name: 'Pet Care', description: 'For Your Furry Friends' },
  { slug: 'liquor-smoking', name: 'Liquor & Smoking (18+)', description: 'For Adults Only' },
];

/** A rule; `not` is an optional pattern that must not appear anywhere in the name. */
const r = (cat, sub, pattern, not) => ({ cat, sub, re: new RegExp(pattern, 'i'), not: not ? new RegExp(not, 'i') : null });

export const RULES = [
  // ---- Liquor & smoking (checked early: "black label", "old durbar" etc. would otherwise look like other things)
  r('liquor-smoking', 'Hookah & Smoking', String.raw`hook?ah|\bcigar|\bsurya\b.*(cig|legend|red|light)|khukuri cig|coconut charcoal|\bshisha|rolling paper|\bbidi\b|\bpaan\b.*molasses|\bmolasses\b|\bmanara\b|\bsancho\b|shikhar cig|marlboro|black cigarette`),
  r('liquor-smoking', 'Beer', String.raw`\bbeer\b|\bbier\b|pilsner|\blager\b|tuborg|carlsberg|gorkha (strong|premium|beer)|barahsinghe|barasinghe|\bhe?ineken|budweiser|\bcorona\b|nepal ice|\barna\b|\bgorkha\b.*\d+ ?ml|3 sisters|\bsomersby|kingfisher strong|\bcider\b|malt beverage`),
  r('liquor-smoking', 'Wine', String.raw`\bwine\b|\bchardonnay|merlot|cabernet|shiraz|\bport wine|\bsangria|hinwa|divine wine`),
  r('liquor-smoking', 'Whisky, Rum & Spirits', String.raw`whisk(e)?y|\bvodka\b|\brum\b|\bgin\b|\bbrandy\b|\btequila|old durbar|black label|red label|blue label|black oak|signature rare|royal stag|blenders pride|8848|\bruslan|golden oak|khukri rum|mcdowell|\bsmirnoff|jack daniel|chivas|glenlivet|teachers?\b.*(ml|ltr)|ballantine|absolut|bacardi|magic moment|\bxxx\b.*rum|virgin \d+|\bice (vodka|whisky)|high ground|\bxxv\b|\bred bull vodka|khukri spiced|\bla martiniquaise|\b(180|375|750|1000) ?ml\b.*(liquor|spirit)`),

  // ---- Strong product types that must win over any brand or flavour word in the name
  r('liquor-smoking', 'Wine', String.raw`winery|chenet|sweet red|\bwine\b|\bport\b.*\d+ ?ml`, String.raw`vinegar|glass|opener`),
  r('gifts-puja', 'Gifts & Party', String.raw`balloo?ns?|ballons|foil fringe|party time|baby shower`),
  r('groceries', 'Noodles, Pasta & Soup', String.raw`noodle|nodles|noddles|\bramen|\bramyun|\bramyeon|\bmaggi\b|\bwai[- ]?wai\b|\brara\b|\bmayos|\bpreeti|chau ?chau|chowmein|chow mein|\bpasta\b|macaroni|spaghetti|vermicelli|\bsevai|seviyan|\bsoup\b|\bnissin|\bpenne|\bfusilli|\bindomie|\bbuldak|samyang`, String.raw`chips|bhujia|sauce|ketchup|cube|magic|masala \d|mayonnaise`),
  r('groceries', 'Breakfast & Cereals', String.raw`corn ?flakes|cereal|muesli|granola|\bchocos\b|kellogg|\boats\b|\boat\b|wheat flakes|honey loops|coco pops|\bdaliya|\bdalia\b`, String.raw`biscuit|cookie|face|scrub|soap|lotion|shampoo`),
  r('groceries', 'Sauces, Pickles & Spreads', String.raw`peanut butter|\bhoney|nutella|hazelnut spread|\bjam\b|\bjams\b|marmalade|(chocolate|caramel|maple|strawberry) syrup`, String.raw`hair|clip|\btea\b|toblerone|shampoo|face|cream|lotion|soap|wash|loops|banana`),
  r('beauty-skincare', 'Makeup & Nail Care', String.raw`lip ?balm|lip ?care`),
  r('groceries', 'Sauces, Pickles & Spreads', String.raw`\bsauce\b|\bsause\b|ketchup|pickle|\bachaa?r\b|\bchhop\b|\bchope?\b|mayonnaise|vinegar|chutney`, String.raw`noodle|ramen|chips|pan\b|soup|pasta`),
  r('groceries', 'Dal & Pulses', String.raw`\bmoong\b|\bmung\b|\bmasoor|\brajma|\bchana\b|\bgahat|\bbhatmas|\bkerau`, String.raw`chips|namkeen|namkin|bhujia|masala|snack|roasted|fry|fried|noodle`),
  r('groceries', 'Cooking Essentials', String.raw`cocoa powder|custard powder|(cooking|baking) (soda|powder)|bread crumbs|crumbs? crunch`),
  r('beauty-skincare', 'Hair Care', String.raw`hair (serum|mask)`),
  r('beauty-skincare', 'Skin Care', String.raw`vitamin[- ]?c\b|vitamin (e|b3)\b|\bserum\b|clea?n?sing (milk|balm)|cleasing|face (mask|sheet)|sheet mask|lip mask`, String.raw`capsule|tablet|chocolate`),
  r('stationery', 'Pens, Pencils & Erasers', String.raw`\b(gel|ball|ball ?point|fountain|mix|glitter|gen mix|metallic|matalic ball i) ?pens?\b|\bpens?\b ?(no\.?|[a-z]*-?\d)`),
  r('stationery', 'Notebooks & Paper', String.raw`\bdairy (no|\d)|dairy \d+k|business affairs dairy|smile mini dairy`),
  r('snacks', 'Chocolates & Candy', String.raw`dairy milk|cadbury|amul dark|dark chocolate|milk chocolate|chocolate`, String.raw`complan|horlicks|bournvita|protein powder|face|lip|soap|flavou?r|drink|syrup|cake|biscuit|cookie|spread|muesli|oats|peanut butter`),
  r('dairy-frozen', 'Ice Cream & Frozen', String.raw`three star|\bfrozen\b`, String.raw`rice|disney|elsa|toy|doll`),
  r('beverages', 'Tea & Coffee', String.raw`\btea ?bags?\b|green ?tea|\btea\b.*\d+ ?(g|gm|kg|bags?)\b|masala tea|\bdilmah|\blipton|\btokla|\btokala|sai kripa|\bcoffee\b(?!.*(mug|cup|maker|table))`, String.raw`cup|mug|kettle|pot\b|set\b|strainer|face|soap|shampoo|wash|serum|cream|tree`),
  r('beauty-skincare', 'Makeup & Nail Care', String.raw`nail ?(cutter|clipper|police|polish|brush)`),
  r('ladies-wear', 'Hair Accessories', String.raw`(hair|side|bow|baby|flower|rose|honey)\b.*\bclips?\b|\bclips?\b.*(hair|bow)|bow clip|\bkata\b.*(flower|print|design|mix)`),
  r('home-living', 'Storage & Organisers', String.raw`cloth.*(clip|peg|hanging)|\bpegs?\b|hanger`),
  r('kitchen-household', 'Bottles & Lunch Boxes', String.raw`lunch ?box|tiffin|hot ?case`),
  r('kitchen-household', 'Kitchen Tools', String.raw`\blighter\b`, String.raw`highlight`),
  r('electronics', 'Lights & Electricals', String.raw`duracell|batter(y|ies)|bettery`),
  r('beauty-skincare', 'Bath & Body', String.raw`(bathing|beauty|gel|moisturi[sz]ing) bar|\bdove bar`),
  r('beauty-skincare', 'Makeup & Nail Care', String.raw`(loose|compact|campact|pro-?) ?powder`),
  r('groceries', 'Spices & Masala', String.raw`(mirch|paprika|timm?ur|marinade|seasoning|mix) powder|piri piri|chill+i flakes|koseli`),
  r('cleaning', 'Detergent & Laundry', String.raw`popular powder|active powder|shakti powder`),
  r('cleaning', 'Floor, Toilet & Glass Cleaners', String.raw`toilet block|cloth brush`),
  r('liquor-smoking', 'Whisky, Rum & Spirits', String.raw`singletion|gurkhas & gun`),
  r('liquor-smoking', 'Wine', String.raw`white wine|red wine`, String.raw`vinegar|glass`),
  r('dairy-frozen', 'Ice Cream & Frozen', String.raw`ice ?cream|ice crem|kulfi`, String.raw`biscuit|cookie|wafer|flavou?r(ed)? (tea|drink)`),
  // ---- Store-specific words found in the product list (brands, Nepali names, spellings used by the store)
  r('liquor-smoking', 'Whisky, Rum & Spirits', String.raw`spiced ru|highlander|vat 69|johnnie walker|singleton|himalayan reserve|signature premier|\bporto\b|tawny`),
  r('liquor-smoking', 'Beer', String.raw`plisner|pilsner`),
  r('liquor-smoking', 'Hookah & Smoking', String.raw`hukka|hooka|charcoal pellet|shikhar`),
  r('baby-care', 'Diapers & Wipes', String.raw`zuvara (s|m|l|xl|xxl|nb|supreme|baby)|dipapers|diper|mother"?s choice new born|\bpotty`),
  r('baby-care', 'Baby Accessories', String.raw`farlin|mumlove|\bibaby|baby (guggles|bacelet|rubber|separated|seperated|bed)`),
  r('baby-care', 'Baby Food & Formula', String.raw`ceregrow|bal bhojan|poshillio kids`),
  r('health-hygiene', 'Feminine Hygiene', String.raw`period pant|\bsagun\b|\bsofy|sofybodyfit`),
  r('health-hygiene', 'Health & Wellness', String.raw`strepsils|pimple patch|acne pimple`),
  r('beverages', 'Tea & Coffee', String.raw`maccoffee|caferite|\bcafe\b|black teas|masal tea`),
  r('beverages', 'Health & Energy Drinks', String.raw`glucovita|bourn ?vita|\bviva\b \d`),
  r('beverages', 'Juices & Squash', String.raw`\bdrinks?\b|smooah|joiner|\bnata\b|frooto|tradao`, String.raw`energy|pudding|jelly|jeli|rasna|syrup|badam|almond|milk`),
  r('dairy-frozen', 'Ice Cream & Frozen', String.raw`vadilal|chocobar|ice crem|\bfalala`),
  r('snacks', 'Chocolates & Candy', String.raw`bar ?one|trident|chewgum|happydent|marshall?ow|truffle|love cany|magic pops|fruit tella|mikybar|milkybar|chooclate|coco mello|\bgudpak|\bkhattu|dolphin jeli|coco crunch`),
  r('snacks', 'Chips, Namkeen & Snacks', String.raw`furandana|dalmot|dalmonth|dhalmooth|nmakin|namakin|sadabahar|bakarwadi|samosa|khatta mitha|lakhamari|balbara|gulmari|pustakari|aaitha|batareko|krako|\bnnjjii|current (nodles|noodles)|\bpiro\b`),
  r('groceries', 'Spices & Masala', String.raw`ajin[ao]moto|tej ?patta|\bteel\b|\btil\b|\bsauf+\b|\bsoff\b|panch ?for|\blaung|jumli simi|timm?ur geda|\bgeda\b(?!.*(moong|mung|chana|rajma|gahat|bhatmas|mas\b|kerau|simi))|oregano|rosemary(?!.*(conditioner|shampoo|oil\b.*hair|hair))|\bbasil\b(?!.*seed)|thyme|chill?i flakes|chilly flakes|seasame|sesame|mungrelo|(?<!gud )\bdana\b|chamsur|magaj|juwano|mustrad|sendha namak|chuk amilo|\bamilo\b`),
  r('groceries', 'Dal & Pulses', String.raw`\bbhatta\b|\bmaas geda|\bsimi\b`),
  r('groceries', 'Rice & Grains', String.raw`makk?ai\b|ramdana|\bquati\b|siltung|\bsilam\b|sabudh?ana|sabudaana|seviyan|jagadamba|\baata`),
  r('groceries', 'Dry Fruits, Nuts & Seeds', String.raw`(?<!olive )\banjir|olives?\b|\bcherry\b(?!.*(blossom|handy))|khurbani|kishmis|dry (kiwi|pineapple)|\bkiwi\b \d|\bvango\b|almonds|mixnut|sunflower kernel|\bpaicho`, String.raw`oil|lotion|hair|wash|\bgel\b|soap|cream|shampoo|pepper|pickle|jam\b|sauce|vinegar`),
  r('groceries', 'Oil & Ghee', String.raw`sunflower oli`),
  r('groceries', 'Cooking Essentials', String.raw`mushrooms?|in brine`),
  r('cleaning', 'Dishwash', String.raw`kitchen cloth|scruber|metal clean|pitambari`),
  r('cleaning', 'Floor, Toilet & Glass Cleaners', String.raw`\bbrush\b(?!.*(tooth|makeup|paint|artist|mac rose|hair|flat))|mr\.? ?muscle|mr genje|kitchen cleaner|sani ?fresh|herbal ?wash|herbwash`, String.raw`foundation|blush|powder|kabuki|contour|eye|lip|nail|face|colgate|sensodyne|oral|zig ?zag|shaving|shave|tooth|make-?up|artist|mac rose|hair|flat|comb|barbi?cue|oil brush|paint|water colou?r|shoe|leather|cloth brush|hand wash`),
  r('cleaning', 'Detergent & Laundry', String.raw`godrej fab|machine wash|comfort mor|patanjali superior powder`),
  r('cleaning', 'Tissues & Paper', String.raw`cling food wrap`),
  r('stationery', 'Pens, Pencils & Erasers', String.raw`hig+h?i?l?i?ghi?t?er|highiter|higlighter|pensil|pensin|mix pen|\bpen\w*\d`),
  r('stationery', 'Notebooks & Paper', String.raw`copier|a4|note ?s? book|dieary|\bnote\d|book cover|labels|chat paper|collection book`),
  r('ladies-wear', 'Jewellery', String.raw`locket|chokar|jagler|\bbeads?\b|beadwork`),
  r('ladies-wear', 'Hair Accessories', String.raw`\brubb?(er|e)\b|rabbar|jaw clips|chimti|scrunehies|hair splint|straigat`),
  r('ladies-wear', 'Bags, Watches & Eyewear', String.raw`guggles|gugles|goggles`),
  r('beauty-skincare', 'Makeup & Nail Care', String.raw`manicure|pedicure|nail clipper|nail clippers|eyeshiley|color stay|colou?r highlight|lip ?stay|lipstistik|lip gloos|sip stick|2- ?waypowder|hairdressing wand`),
  r('beauty-skincare', 'Fragrance & Deodorant', String.raw`bellavita|\benvy\b|parfum|perfum|body ?/?mist|body lovin|wottagirl|ramsons|\bks spark|\bdark spray|natural spray|\baseel|bakhour`),
  r('beauty-skincare', 'Skin Care', String.raw`\bscrub\b|scrup|wax (strips|stick)|\bwax\b|glc?erine|glcerine|\bsun\b|sun ?creen|shadow spf|ampoule|creme|collagen|fair and handsome|moisturzing|face wash|faace|carbon`),
  r('beauty-skincare', 'Bath & Body', String.raw`imperial leather|kanti soap|neen kanti|gentle baby shop|dermi cool`),
  r('beauty-skincare', 'Oral Care', String.raw`zig ?zag.*brush|manjan|tothpaste|\bteeth\b|zig ?zag`),
  r('beauty-skincare', 'Hair Care', String.raw`argan oli|7 ?in ?one oils|head and shoulders|natural brown`),
  r('electronics', 'Personal Care Appliances', String.raw`lint remover|hair ti?mmer`),
  r('electronics', 'Lights & Electricals', String.raw`tourch|door bell`),
  r('kitchen-household', 'Bottles & Lunch Boxes', String.raw`thor?mas|vacuum|spary bottel|\bsport bottle`),
  r('kitchen-household', 'Kitchen Tools', String.raw`chopsticks?|skewer|barbicue|silicone (black )?spone|oli brush|llighter|jet flame`),
  r('toys', 'Toys', String.raw`metal car|batman|spin+ing car|rail car|\bcar\b.*(no\.?|yc|toy)|\br/c\b|\bjeep\b|racing|die-cast|dinos(u|au)r|\bpaino\b|dough|dream castle|tetris|bead maze|animal (world|set)|single animal|doctor'?s kit|shape recognition|learning board|time learner|zoo balance|whistle|elephant|gyro|baby barbi|pretty girl|chu-chu|happy bl|taxiing|spiderman|super hero|climbing car|trumpet|sumberd|kering|\bmike\b|magic water book|color mud|ripper|pull ?& ?push|air mattress|number look|unicorn|kuromi|kuluomi|\bstich\b`),
  r('toys', 'Games & Puzzles', String.raw`playing tas|\btas\b|trengle set`),
  r('gifts-puja', 'Gifts & Party', String.raw`candel|christmas|ballons|snow spray|rose red|gold leaf|straw pice|giftset|gift set`),
  r('gifts-puja', 'Puja Items', String.raw`rakhshya|raksha|rudhrax|rudrax`),
  r('home-living', 'Storage & Organisers', String.raw`hooks?\b|stan\b|mirron|\bkapada\b`),
  r('home-living', 'Bags, Umbrellas & Travel', String.raw`umberlla`),

  // ---- Pet
  r('pet-care', 'Pet Food & Accessories', String.raw`\bdog\b|\bcat food|\bpuppy|\bpedigree|\bwhiskas|\bdrools|\bpet\b|kitten|dog (soap|shampoo|leash|belt)|leash|tick and flea`),

  // ---- Baby (before beauty/food so "baby shampoo", "baby lotion", "baby food" land here)
  r('baby-care', 'Diapers & Wipes', String.raw`diaper|baby.*wipes|\bpampers|huggies|mamy ?poko|chikool|\bpants\b.*\b(s|m|l|xl|xxl)\d+|baby (wipe|pant)|\bsnuggy|\bbambo\b|\bteddyy\b|little angel|merries|wet wipes? baby`),
  r('baby-care', 'Baby Food & Formula', String.raw`lactogen|nan pro|\bnan\b \d|cerelac|farex|similac|similack|\bformula\b|\bbaby food|\bnestum|aptamil|enfamil|lactodex|dexolac|infant|\bnutricia|\bstage \d\b|newborn|\bmilupa|baby (cereal|nibble)|nibbler|\bpediasure`),
  r('baby-care', 'Baby Bath & Skin Care', String.raw`baby (oil|lotion|cream|shampoo|soap|wash|powder|power|massage|bath|tooth|care|gift|rash|hair oil|sun)|johnson'?s? baby|himalaya (baby|babycare)|mamaearth baby|sebamed baby|chicco|mee mee|aiwibi|dabur lal tail|\blal tail|\bbubble wash|\bbaby\b.*(wash|shampoo|lotion|oil|cream|powder)|kids? (tooth|protect)|jordan baby`),
  r('baby-care', 'Baby Accessories', String.raw`feeding bottle|\bfeeder\b|\bnipple|\bpacifier|\bteether|\bsipper|baby (clip|bottle|spoon|bib|blanket|carrier|walker|bed|net|mat|brush|comb|nail|set|sock|cap|towel|dress|shoe|kata|bangle)|\bbib\b|sippy|\bpigeon\b|\bnuby`),

  // ---- Health & hygiene
  r('health-hygiene', 'Feminine Hygiene', String.raw`sanitary|\bnapkin|\bpads?\b|whisper|stayfree|\bsofy\b|\bjuni\b.*(pad|panty|liner|xl|napkin)|panty ?liner|\bnine\b.*(pad|xl|comfort)|menstrual|\bcarefree|\btampon|aiwina|\bv[- ]?wash|intimate`, String.raw`lock|paper|scrub|writing|memo|note|exam|mouse|cotton pad|makeup|eye ?pad|knee`),
  r('health-hygiene', 'Health & Wellness', String.raw`chyawan|shilajit|glucon[- ]?d|electral|\bors\b|jeevan jal|vicks|vapou?rub|(?<!(lip|beauty|cleansing) )\bbalm\b|zandu|iodex|moov|volini|hajmola|pudin ?hara|eno\b|digene|isabgol|\bsat ?isabgol|\bdettol antiseptic|savlon|antiseptic|bandage|band[- ]?aid|\bcotton (roll|wool)|thermometer|surgical mask|\bk?n95\b|hand sanitizer|sanitiser|sanitizer|condom|durex|kamasutra|\bmanforce|pregnancy|prega news|\bmultivitamin|vitamin (tablet|capsule|supplement|gumm)|protein powder|whey|\bstress relief|kulzum|\bhamdard|\bamrit\b|triphala|ashwagandha|tulsi drops|\bdabur (honey|chyawan)|patanjali (chyawan|shilajit|honey|amla|aloe vera juice|giloy)|\bgiloy|\bamla juice|aloe ?vera juice|\bnasal|inhaler|pain relief|\bspray\b.*pain|\bdoctor\b.*(tape|plaster)|\bplaster\b|ear ?buds|cotton (swab|bud|ball)|\bbuds\b`),

  // ---- Cleaning & laundry
  r('cleaning', 'Detergent & Laundry', String.raw`detergent|\bsurf\b|surf excel|\bariel\b|\btide\b|\brin\b|wheel\b.*(surf|\d)|\bhenko|\bghadi\b|nirma|\bpatanjali\b.*(detergent|washing)|washing (powder|soap|liquid|bar)|laundry|fabric (wash|conditioner|softener)|comfort (fabric|after wash)|\bvanish\b|robin (liquid|blue)|\bnil\b.*blue|\bujala|\bsunlight\b|\bfena\b|front load|top load|\bmatic\b|\bstarch\b|\blizol\b.*fabric|\bbleach|\bclorox`),
  r('cleaning', 'Dishwash', String.raw`dish ?wash|\bvim\b|\bpril\b|\bexo\b|dishwashing|scourer|scrubber|\bscrub pad|steel wool|^(?!.*bath).*\bspong(e|ie)\b(?!.*(face|makeup|puff|beauty|blender))|utensil (cleaner|bar)`),
  r('cleaning', 'Floor, Toilet & Glass Cleaners', String.raw`harpic|\blizol|colin|phenyl|floor clean|toilet clean|glass clean|\bdomex|sanifresh|\bmop\b|\bbroom\b|\bjharu|kucho|toilet brush|dust ?pan|\bwiper\b|cleaning (brush|cloth)|\bduster\b|surface clean|\bdettol\b.*(floor|surface|disinfectant)|drain clean|\bnaphthalene|\bodonil|\bgarbage bag|dustbin bag|trash bag|\bhit\b.*(liquid|floor)`),
  r('cleaning', 'Tissues & Paper', String.raw`tissue|\bnapkins? paper|paper napkin|toilet (roll|paper)|kitchen (roll|towel)|facial tissue|\bpaper towel|\bwipes?\b(?!.*(baby|face|facial|makeup))|\bfoil\b|aluminium foil|cling ?(film|wrap)|butter paper|zip ?lock`),
  r('cleaning', 'Fresheners & Repellents', String.raw`air ?fresh|aer\b|aermatic|\bodonil|\bambi ?pur|room (spray|fresh)|mosquito|good ?night|all ?out|mortein|\bhit\b|\bbaygon|\bodomos|cockroach|\brepellent|\bcoil\b|fast card|\binsect|\bratol|\brat (kill|cake|trap|glue)|\bnaphthalene balls|\bcamphor\b.*ball|car freshener`),

  // ---- Beauty & personal care
  r('beauty-skincare', 'Oral Care', String.raw`tooth ?paste|tooth ?brush|toothpick|\bcolgate|pepsodent|close ?up|sensodyne|\bdabur red|\bmeswak|\bdant ?kanti|\blordent|\bmouth ?wash|listerine|mouth fresh|\bfloss|\boral[- ]?b\b|\bpatanjali dant|\bdentic|\bneem (tooth|datun)|\btongue clean|\bbrush\b.*(soft|medium|tooth|kids)`),
  r('beauty-skincare', "Men's Grooming", String.raw`gillette|gillete|\brazor|shav(e|ing)|after ?shave|\bblade\b|\btrimmer\b(?!.*(kitchen|vegetable))|\bbeard|men\b.*(face ?wash|fw|cream|serum)|\bmen'?s\b|nivea men|garnier men|ponds men|\bbombay shaving|park avenue(?!.*her)|\bvi-?john|old spice|\bset wet|\bgatsby|\baxe\b|\bwild stone|\bhair (gel|wax)|\bdenver`),
  r('beauty-skincare', 'Fragrance & Deodorant', String.raw`\bdeo\b|deodorant|perfume|\bbody (spray|mist)|\bfogg\b|\bscent|\bedp\b|\bedt\b|eau de|\battar|\bitra?\b|\bplom\b|\bcologne|\byardley|\bengage\b|\bnivea\b.*(deo|roll)|roll[- ]?on|\bhis & her|\bpark avenue for her|\btmc\b|\bkhus|\bbrut\b|\bdenim\b.*(ml|deo)`),
  r('beauty-skincare', 'Hair Care', String.raw`shampoo|conditioner|hair (oil|colou?r|dye|mask|serum|spa|cream|fall|regrowth|growth|treatment|straight|smooth|care|removal|remover|tonic|pack|vitamin|keratin)|keratin|\bparachute|\bnavaratna|\bnavratna|\bkesh ?king|\bkesh kanti|\bbajaj (almond|coconut|brahmi|amla)|coconut oil|almond (drops|hair)|amla (hair|oil)|\bdabur amla|\bclinic plus|\bsunsilk|\bdove\b.*(shampoo|conditioner|hair)|\bpantene|\bhead ?& ?shoulders|\btresemme|\bloreal\b.*(paris )?(excellence|casting|color|hair|total repair|extraordinary)|garnier colou?r|color naturals|\bgodrej (expert|nupur)|\bindica\b|\bhenna|\bmehendi|\bvasmol|kesh kala|\bstreax|\bbblunt|\bwella|\bwell 10|\bmatrix\b|\blivon|hair gel|\bveet\b|\bnair\b|\bemami 7 ?oils|7 ?oils in one|\bsatthwa\b|\bindulekha|\bhimalaya\b.*(anti-dandruff|hair)|\bbtc\b|\bhair\b.*\d+ ?ml`),
  r('beauty-skincare', 'Makeup & Nail Care', String.raw`lipstick|lipstic|lip ?(gloss|liner|tint|balm|blam|oil|care|plumper|glow|color)|\blips?\b|\bkajal|\bkohl|eyeliner|eye ?liner|mascara|eye ?shadow|eye ?brow|\beyelash|\blash(es)?\b|foundation|\bprimer|concealer|compact (powder)?|\bblush(er)?\b|highlighter(?!.*(pen|marker))|\bbronzer|makeup|make-up|make up|\bnail ?(polish|paint|color|colour|art|remover|file|kit|glue)|\bnails\b|nail lacquer|\bsindoor|\bsindur|\bbindi\b|\bmaybelline|\blakme\b(?!.*(cc|cream|sun|moistur|face ?wash|serum))|\bswiss beauty|\bsugar\b.*(matte|lip)|\bcolorbar|\bmars\b|\bpink ?flash|\bsetting spray|\bmakeup (remover|sponge|brush)|beauty blender|puff\b|\bcosmetic|\bgel ?liner|\bface karite|\bmiss rose|\bhuda\b|\bcv3\b|\bkiss beauty`),
  r('beauty-skincare', 'Bath & Body', String.raw`\bsoap\b|body ?wash|shower gel|hand ?wash|handwash|bath(ing)? (bar|soap|gel|salt)|\blux\b|\blifebuoy|\bdettol\b|\bsantoor|\bdove\b|\bpears\b|\bmedimix|\bcinthol|\bhamam|\bmysore sandal|\bmargo\b|\bdettol|\bpalmolive|\bgodrej no\.? ?1|\bdabur (rose|gulab)|talc|\bpowder\b.*(prickly|talc|cool|body)|prickly heat|\bnycil|\bponds\b.*(powder|talc)|dusting powder|\bloofah|\bpumice|\bbody (lotion|butter|scrub|milk|oil)|\bvaseline|petroleum jelly|\bboroplus|\bboro ?line|\bcold cream|\bglycerin|\bglycerine|\bnivea\b(?!.*(men|deo|lip))|\bpurity\b|\bjergens|\bst\.? ?ives`),
  r('beauty-skincare', 'Skin Care', String.raw`face ?wash|facewash|\bf\.?w\b|cleanser|cleansing|\bserum\b|moisturi[sz]|sun ?screen|sunscreen|\bspf\b|sun (block|protect|cream|gel)|face (cream|mask|pack|gel|scrub|mist|toner|serum|oil|wash)|\btoner\b|\bfacial\b|night cream|day cream|\bcream\b|\blotion\b|aloe ?vera (gel|cream)|\bgel\b|\bpeel|\bniacinamide|\bretinol|\bretinal|hyaluron|\bvitamin c\b|\baha\b|\bbha\b|salicylic|\bceramide|\bmultani|\bubtan|\bgulab ?jal|rose ?water|\bponds\b|\bgarnier|\bhimalaya\b|\bmama ?earth|\bthe derma|derma ?co|\bminimalist|\bplum\b|\blotus (herbal|white|professional)|\bolay|\bneutrogena|\bcetaphil|\bbioderma|\bsimple\b|\bclean ?& ?clear|\bacnes\b|\bfair ?& ?lovely|glow ?& ?lovely|\bfairness|\bwokali|\bjoy\b.*(gel|cream|lotion)|\byuthika|\bkejjan|\bbanjara|\bnewlook|\bpamacare|\basta ?berry|\bdr\.? ?rashel|\bsheet mask|\bfassupu|\bsilcon|\bleito|\blakme\b|\bnykaa|\bdot ?& ?key|\bwow\b.*(face|skin)|\bbeauty\b|\bskin\b|\bface\b`),

  // ---- Stationery
  r('stationery', 'Notebooks & Paper', String.raw`note ?book|notebook|\bcopy\b|exercise book|register|\bdiary\b|\bdairy\b.*(sc|\d)|sketch ?book|drawing book|scrap ?book|\bjournal|\bpaper\b(?!.*(napkin|towel|roll|plate|cup|bag|soap))|\ba4\b|\bchart paper|\bcard ?board|\bsticky notes?|stick notes|\bpost[- ]?it|\bmemo pad|\bwriting pad|\bfile\b|folder|\benvelope|\bclip ?board|\bgraph book`),
  r('stationery', 'Pens, Pencils & Erasers', String.raw`\bpen\b|\bpens\b|ball ?pen|gel pen|\bpencil|eraser|earse|\brubber\b.*(eraser|pencil)|sharpener|\brefill|\bmarker|highlighter|\bink\b|fountain|\bcello\b|\bnataraj|\bapsara|\blinc\b|\breynolds|\bdoms\b|\bflair\b|\bmechanical pencil|lead (pencil|box)|\bcorrection (pen|tape)|\bwhitener|\bchalk`),
  r('stationery', 'Art & Craft', String.raw`colou?r(s|ing)? ?(pencil|pen|book|set|box)|crayon|\bpaint(s|ing)? ?(set|brush)|acrylic|water ?colou?r|oil pastel|\bpastel|\bsketch pen|\bglitter|\bfevicol|\bfevi ?kwik|fevikwik|\bglue\b|\bgum\b.*(stick|bottle)|glue stick|\bcraft|\bclay\b(?!.*(face|mask))|\bstencil|\bpalette|\bcanvas|\bstamp|\bsticker|\bribbon|\bfoam (sheet|soft)|\bcolour paper|\bbrush set`),
  r('stationery', 'School & Office Supplies', String.raw`geometry|\bscale\b|\bruler|compass|protractor|stapler|staple|\bpunch|calculator|\btape\b(?!.*(measure|doctor))|cello ?tape|\bscissor|\bcutter\b(?!.*(nail|vegetable|pizza))|paper cutter|\bpin\b(?!.*(hair|safety|sadi|saree))|\bpins\b|\bclip\b(?!.*(hair|side|baby|bow|claw|banana))|\bbinder|\bboard (marker|pin)|white ?board|black ?board|\bslate\b|pencil (box|case|pouch)|\bpouch\b.*pencil|school bag|\bbackpack|lunch (box|bag)(?!.*steel)|\bwater bottle\b.*kid|\blcd writing|\bwriting table|\bstationery|\bdesk\b|\bglobe\b|\bid card|\bexam pad`),

  // ---- Toys, games & sports
  r('toys', 'Sports & Fitness', String.raw`\bball\b(?!.*(cotton|pu ball|makhana|choco|chocolate|cheese|candy|rice|pen))|football|basketball|volleyball|cricket|\bbat\b|badminton|shuttle|racket|racquet|\bcarrom|chess|\bludo|skipping|\bskip rope|\byoga\b(?!.*bar)|dumbbell|\bgym\b|\bfitness|\bsports?\b(?!.*(drink|bottle|bra|shoe))|\bswim|\bfloat\b|\bintex|\bcycle\b|\bskate|\bhelmet|\btable tennis|\bdart|\bfrisbee|\bgoggles`),
  r('toys', 'Toys', String.raw`\btoy|\bteddy|\bdoll\b|\bdolls\b|\bbarbie|\bcar\b.*(no|remote|toy|metal|model|friction|racing)|\bremote control|\brc\b|\btruck\b|\bdozer|\bdojer|\btrain\b|\bhelicopter|\baeroplane|\bplane\b|\brobot|\bgun\b|\bshooting|\bbubble\b(?!.*(wash|gum))|\bpuzzle|\bblocks?\b|\blego|\bbuilding|\bkitchen set|\bdoctor set|\btool set\b.*kid|\bmusical\b|\bguitar\b|\bpiano|\bdrum\b|\brattle|\bspinner|\bslime|\bsqueez|\bsquish|\bfidget|\bpop it|\bbeyblade|\bdinosaur|\banimal set|\bplay ?(set|house|dough)|\bclay dough|\bbalance bike|\btricycle|\bkids?\b.*(car|bike|scooter|set)|\bmagic\b.*(cube|trick)|\brubik|\bcube\b|\bsoft (pu )?ball|pu ?ball|\bkite\b|\bwater gun|\bpistol|\btop\b.*spin|\bno\.? ?[a-z]*-?\d{3,}.*(car|truck|gun|robot)|\bmailipox|\blabubu|\bhello kitty|\bcartoon`),
  r('toys', 'Games & Puzzles', String.raw`\bgame\b|\bgames\b|\bcards? game|playing cards|\buno\b|\bsnake ?(and|&) ?ladder|\bmonopoly|\bscrabble|\bjenga|\bdice\b`),

  // ---- Electronics
  r('electronics', 'Kitchen Appliances', String.raw`rice cooker|\bcooker\b(?!.*pressure)|\bkettle|induction|\bmixer|\bgrinder|\bblender|\bjuicer|\btoaster|sandwich maker|\bmicrowave|\boven\b|\bair fryer|\bchopper\b.*electric|\bhot plate|\bheater\b|water heater|\bgeyser|\bimmersion|\brod\b.*heater|\bcoffee maker|\begg boiler|\bhot case\b.*electric|\bfan\b|\btable fan|\bceiling fan|\bexhaust`),
  r('electronics', 'Personal Care Appliances', String.raw`hair ?dryer|dryer\b|straightener|\bcurler|\btrimmer|\bshaver\b|\bepilator|\biron\b|\bsteam iron|\bmassager|\bweighing (scale|machine)|\bhair (clipper|crimper)|\bkemei|\bnova\b|\bphilips\b`),
  r('electronics', 'Lights & Electricals', String.raw`\bbulb|\bled\b|\blight\b(?!.*(weight|moistur|hydrat|lotion|gel|cream))|\blamp\b|\btube ?light|\bextension|\bmulti ?plug|\bplug\b|\bsocket|\bswitch|\bholder\b(?!.*tooth)|\bwire\b|\bcable\b(?!.*tie)|\btorch|\bflash ?light|\bemergency light|\bbattery|\bbatteries|\bbettery|\bcell\b|\bduracell|\beveready|\beveryday\b.*(size|cell|battery|bettery)|\bsolar\b|\binverter|\bstabili[sz]er|\bfancy light|\bfairy light|\bjhalar|\bdecorative light`),
  r('electronics', 'Mobile & Audio', String.raw`charger|\bearphone|\bheadphone|\bearbuds?\b|\bneckband|\bspeaker|\bbluetooth|\bpower ?bank|\bdata cable|\busb\b|\btype[- ]?c\b|\bmobile\b|\bphone (stand|holder|cover|case)|\bmemory card|\bpen ?drive|\bmouse\b|\bkeyboard|\bsmart ?watch|\bwatch\b.*smart|\bselfie|\btripod|\bmic\b|\bmicrophone|\bremote\b(?!.*(control car|car))|\bwireless\b|\bpower adapter|\badapter\b|\bhdmi|\bcamera`),
  r('electronics', 'Appliances & Gadgets', String.raw`\belectric|\bappliance|\bpump\b|\bair pump|\bmachine\b(?!.*wash)|\bmotor\b(?!.*rs)|\bdigital\b|\bgadget`),

  // ---- Kitchen & dining
  r('kitchen-household', 'Cookware', String.raw`pressure cooker|\bcooker\b|\bkadai|\bkadhai|\bkarahi|\bpan\b|fry ?pan|\btawa\b|\bpatila|\bhandi\b|\bcasserole|\bpot\b(?!.*(flower|plant))|\bsaucepan|\bwok\b|\bcookware|\bnon[- ]?stick|\btope\b|\bdekchi|\bidli|\bsteamer|\bmomo (steamer|maker)|\bdhikri|\bhot ?case|\bhot ?pot|\binsulated`),
  r('kitchen-household', 'Kitchen Tools', String.raw`\bknife|\bknives|\bpeeler|\bgrater|\bchopper|\bslicer|\bcutting board|chopping board|\bladle|\bspatula|\bspoon\b|\bspoons\b|\bfork\b|\btong\b|\bstrainer|\bsieve|\bchalni|\bcolander|\bwhisk\b|\bmasher|\brolling pin|\bbelna|\bchakla|\bgas lighter|\blighter\b|\bmatch ?box|\bsalai\b|\bopener|\bcan opener|\bkitchen (tool|scissor|knife|set|rack|stand|towel)|\bspice (box|rack|jar)|masala (box|dani|dabba)|\bdibba\b|\bgarlic press|\bjuicer\b.*hand|\blemon squeez|\bmeasuring|\bmortar|\bkharal|\bhamaam dasta|\boil (bottle|dispenser)|\bsprayable|\bapron|\bpot holder|\boven mitt|\bgloves\b.*kitchen|\bscrubber|\bnet\b.*(fruit|vegetable)|\bsink\b`),
  r('kitchen-household', 'Cups, Mugs & Glassware', String.raw`\bcup\b|\bcups\b|\bmug\b|\bmugs\b|\bglass\b(?!.*(clean|cleaner|goggle|sun))|\bglasses\b(?!.*sun)|\bglassware|\btumbler|\bsaucer|\bjug\b|\bpitcher|\bdecanter|\bkettle\b.*(glass|tea)|\btea ?pot|\bcoffee (cup|mug)|\bwine glass|\bshot glass|\bcup set|\bunion glass|\bg?llassware`),
  r('kitchen-household', 'Dinnerware & Serving', String.raw`\bplate\b|\bplates\b|\bdinner (set|plate)|\bbowl\b|\bbowls\b|\bthali|\btray\b|\bserving|\bcasserole|\bdinner ?ware|\bcutlery|\bcrockery|\bmelamine|\bopal\b|\bceramic|\bporcelain|\btable ?cloth|\btable mat|\bplacemat|\bcoaster|\bnapkin (holder|ring)|\bcake stand|\bfruit basket|\bdish\b(?!.*wash)|\bpaper (plate|cup)|\bdisposable`),
  r('kitchen-household', 'Bottles & Lunch Boxes', String.raw`\bbottle\b(?!.*(feeding|baby|oil|spray|shampoo|wine|beer))|\bflask|\bthermos|\bsipper|\blunch ?box|\btiffin|\bcasserole|\bcontainer|\bairtight|^(?!.*(seed|nut|cashew|almond|tea\b|coffee|pickle|honey|pumpkin|chia|raisin|dates|kishmis|walnut)).*\bjar\b|\bstorage (box|jar|container)|\bmilton|\bcello\b.*(bottle|box|container)|\bsigno|\btupperware|\bbaltra|\bwater (bottle|jug|can)|\bfridge bottle|\btiffin`),

  // ---- Home & living
  r('home-living', 'Storage & Organisers', String.raw`\bstorage|\borgani[sz]er|\brack\b|\bshelf|\bstand\b(?!.*(cake|phone|mobile))|\bhanger|\bhook\b|\bwall hook|\bbasket\b|\bbin\b|\bdustbin|\bbucket|\bmug\b.*(bath|plastic)|\bbath ?mug|\btub\b|\bdrum\b.*(plastic|water)|\bbox\b(?!.*(match|lunch|pencil|gift|sweet|tiffin))|\bdrawer|\bcloth(es)? (clip|peg|line|stand|hanger)|\bshoe (rack|stand)|\bcabinet|\bstool|\bchair\b|\btable\b(?!.*(cloth|mat|fan|tennis|writing|spoon|salt))|\bfolding|\bplastic\b`),
  r('home-living', 'Home Decor & Furnishing', String.raw`\bdecor|\bshow ?piece|\bshow plece|\bflower vase|\bvase\b|\bartificial (flower|plant)|\bflower\b(?!.*(hair|clip|band|oil|water|honey))|\bphoto frame|\bframe\b|\bmirror|\bmirro\b|\bmirrow|\bwall (clock|sticker|hanging|decor)|\bclock\b|\bcurtain|\bcushion|\bpillow|\bbed ?sheet|\bblanket|\bquilt|\bcarpet|\bdoor ?mat|\bmat\b|\brug\b|\bcandle(?!.*(birthday|cake))|\bdiffuser|\bfountain\b.*decor|\bpainting|\bstatue|\bidol\b|\bnight lamp|\btowel\b|\bbath ?(towel|mat|curtain)|\bmosquito net|\bnet\b.*(bed|mosquito)`),
  r('home-living', 'Bags, Umbrellas & Travel', String.raw`\bumbrella|\bbag\b|\bbags\b|\btrolley|\bsuitcase|\bluggage|\btravel|\bduffel|\bshopping bag|\bjute bag|\braincoat|\brain ?coat`),
  r('home-living', 'Tools, Hardware & Auto', String.raw`\bhammer|\bscrew|\bdriver\b|\bplier|\bspanner|\bwrench|\bdrill|\btool ?(kit|box|set)|\bnail\b(?!.*(polish|paint|color|colour|art|cutter|clipper|file|kit|glue|remover|care))|\bpad ?lock|\block\b(?!.*(zip|lip))|\bpadlock|\bkey ?(chain|ring)|\bmeasuring tape|\bmeasure tape|\binch tape|\btape measure|\bm-?seal|\bsilicon(e)? (gun|seal)|\bsuper glue|\bpipe\b|\btap\b|\bshower (head|set)|\bhose\b|\bcar (wash|polish|freshener|shampoo|care|charger|mat)|\bbike\b(?!.*(moto|racing|toy))|\bhelmet|\bengine oil|\bcar (wash|polish|freshener|shampoo)|\bauto\b|\bpolish\b(?!.*(nail|shoe))|\bwd-?40|\btyre|\bchain lube|\bladder\b(?!.*snake)|\brope\b(?!.*skip)|\btarpaulin|\btorch\b|\bsafety pin|\bneedle|\bthread\b|\bsewing|\bbutton\b|\bzip\b|\bvelcro|\bcable tie|\bshoe (polish|brush|cream)|cherry blossom|\bkiwi\b.*(shoe|polish)|\bshoe polish|\bdark tan`),

  // ---- Fashion
  r('ladies-wear', 'Jewellery', String.raw`\bjewel|jewellry|jewellery|\bjhumka|\bearring|\bearing|\bnecklace|\bmala\b|\bmoti\b|\bpendant|\bchain\b(?!.*(lube|key))|\bbracelet|\bbangle|\bchura|\bring\b(?!.*(key|napkin))|\brings\b|\banklet|\bpayal|\bnose ?pin|\bmangal ?sutra|\bpote\b|\btilhari|\bkanthi|\bsadipin|\bsaree pin|\bbrooch|\bcrown\b|\btiara|\bkata\b|\bstone\b.*(set|mix)|\bset\b.*(earring|necklace)`),
  r('ladies-wear', 'Hair Accessories', String.raw`hair ?(band|clip|pin|tie|rubber|accessor|claw|bow|bank|catcher|clutcher|stick)|\bside ?clip|\bbow clip|\btik ?tik|\bclutcher|\bbanana clip|\bscrunchie|\bheadband|\bhead band|\brubber band\b(?!.*money)|\bhair\b.*\bpin\b|\bjuda\b|\bbun maker|\bcomb\b|\bcombs\b|\bhair brush|\bpit ?pite|\bdat bow`),
  r('ladies-wear', 'Bags, Watches & Eyewear', String.raw`\bhand ?bag|\bpurse\b|\bwallet|\bclutch\b|\bsling bag|\bwatch\b(?!.*smart)|\bwatches\b|\bsun ?glass|\bspecs\b|\bgoggle|\bbelt\b(?!.*dog)|\bkey ?chain`),
  r('ladies-wear', 'Footwear', String.raw`\bshoe\b(?!.*(polish|brush|cream|rack|stand))|\bshoes\b(?!.*polish)|\bslipper|\bsandal|\bchappal|\bflip ?flop|\bheels?\b|\bboot\b|\bboots\b|\bsneaker|\bsocks?\b`),
  r('ladies-wear', 'Clothing', String.raw`\bt[- ]?shirt|\bshirt\b|\btop\b(?!.*spin)|\btops\b|\bkurti|\bkurta|\bsaree|\bsari\b|\blehenga|\bdress\b|\bfrock|\bgown|\bleggings?|\bjeans|\bpant\b|\btrouser|\bshorts?\b|\bskirt|\bjacket|\bsweater|\bhoodie|\bcardigan|\bshawl|\bstole\b|\bscarf|\bdupatta|\bmuffler|\bcap\b|\bhat\b|\bgloves?\b|\bwarm\b|\bthermal|\binner ?wear|\bbra\b|\bpanty\b(?!.*liner)|\bunderwear|\bbriefs?\b|\bvest\b|\bnighty|\bnight ?suit|\bpyjama|\bpajama|\btowel\b.*(hair|turban)|\bb\.b top|\bfashion\b|\bhandkerchief|\bmask\b.*(cloth|fashion)`),

  // ---- Gifts & puja
  r('gifts-puja', 'Puja Items', String.raw`agarbatti|incense|\bdhoop|\bdhup\b|\bkapur\b|\bcamphor|\bdiyo|\bdiya\b|\bbatti\b|\bcotton wick|\bpuja|\bpooja|\bghee batti|\bsindoor\b.*puja|\babir\b|\btika\b|\bjanai|\bdhago|\brudraksha|\bmala\b.*(rudraksh|tulsi)|\bkalash|\bgangajal|\bchandan\b(?!.*(soap|powder|face|kanti))|\bmangal ?deep|\bcycle agarbatti|\bzed black|\bhari darshan|\btaj 555`),
  r('gifts-puja', 'Gifts & Party', String.raw`\bgift\b|\bgifts\b|\bballoon|\bbirthday|\bparty\b|\bcandle\b.*(birthday|cake|number)|\bconfetti|\bpopper|\bbanner\b|\bhappy birthday|\bfoil balloon|\bribbon\b|\bwrapping|\bgreeting card|\bcard\b(?!.*(memory|game|playing|board))|\bdecoration|\bheart\b.*(balloon|shape)|\bsparkle|\bmagic candle|\bfestival|\btihar|\bdashain|\bholi|\bcolour (powder|gulal)|\bgulal|\bpichkari`),

  // ---- Beverages (before snacks/grocery so "chocolate drink", "coffee" land here)
  r('beverages', 'Tea & Coffee', String.raw`\btea\b(?! ?masala)|\bchiya\b(?!.*seed)|green tea|\btetley|\btaza\b|\btaaza|\btokla|\bred label\b.*tea|\bbrooke bond|\blipton|\bgorkha tea|\bilam\b|\bcoffee|\bnescafe|\bbru\b|\bcappuccino|\blatte|\bespresso|\bhimalayan java|\bmacha|\bmatcha|\bchai\b|\bcreamer`),
  r('beverages', 'Health & Energy Drinks', String.raw`energy|badam (milk )?drink|almond drink|milk ?shake|horlicks|bournvita|boost\b|complan|\bmilo\b|\bovaltine|protinex|\bred ?bull|\bmonster\b|\bsting\b|\bxl energy|\benergy drink|\bgatorade|\bpowerade|\belectrolyte|\bglucose|\btang\b|\brasna|\bnimbu pani|\bsatu\b|\bsattu|\bprotein\b.*(drink|shake)|\bmalt\b(?!.*beverage)|\bpediasure|\bensure\b`),
  r('beverages', 'Soft Drinks & Soda', String.raw`\bcoke\b|coca[- ]?cola|\bpepsi|\bsprite|\bfanta\b|\bmountain dew|\bdew\b|\b7 ?up\b|\bmirinda|\bthums up|\bslice\b(?!.*(bread|cheese|jerky|chicken))|\bmaaza|\bcampa\b|(?<!(cooking|baking) )\bsoda\b(?!.*(cracker|biscuit|bicarbonate))|\bsoft drink|\btonic water|\bginger ale|\bsparkling|\bcola\b|\bfizz|\bmojito|\blemonza|\bkombucha|\bredbull`),
  r('beverages', 'Juices & Squash', String.raw`\bjuice|\bfrooti|\breal\b.*(juice|fruit|\d+ ?ml)|\btropicana|\bpaper boat|\bappy\b|\bsquash|\bsharbat|\bsherbet|\brooh ?afza|\bcrush\b|\bsyrup\b(?!.*(cough|chocolate|maple))|\bnectar|\bb natural|\bsafal|\bdabur real|\bfruit drink|\bbasil seed|\bnawon|\baloe ?vera drink|\bokf\b|\bjelly drink|\blassi|\bbutter ?milk|\bbuttermilk|\bmango (drink|juice)|\bmala'?s\b`),
  r('beverages', 'Water', String.raw`\bmineral water|\bdrinking water|\bwater\b.*(\d+ ?(ml|l|ltr|litre)|bottle)|\bkinley|\baquafina|\bbisleri|\bhimalayan (spring|water)|\bnestle pure life`),

  // ---- Dairy, bakery & frozen
  r('dairy-frozen', 'Ice Cream & Frozen', String.raw`ice ?cream|\bkulfi|\bfrozen|\bcornetto|\bmagnum|\bpopsicle|\bfrozen (momo|peas|corn|chicken|food)|\bmomo\b.*(frozen|\d+ ?pcs)|\bjayasa|\bnuggets|\bsausage|\bsaussage|\bsalami|\bham\b|\bbacon|\bfrench fries|\bsmiles\b|\bparotha|\bparatha|\blachha|\bfish finger|\bchicken (momo|nugget|popcorn|sausage|salami)|\bmilky bites|\bazzabko|\bbaskin|\bamul (ice|kulfi)|\bdesser?t\b`),
  r('dairy-frozen', 'Milk, Butter & Cheese', String.raw`\bmilk\b(?!.*(chocolate|choco|biscuit|rusk|lotion|cream|bar|candy|toffee|bikis|powder\b.*baby|body|cleanser|face|shake mix|bread|maid|tea))|\bmilk powder|\bdairy (milk|whitener)|\bwhitener|\bbutter\b(?!.*(cookie|cookies|biscuit|milk|scotch|paper|body|cream biscuit|cake|chicken))|\bcheese\b(?!.*(balls|puff|biscuit|crack|chips|cracker|nachos|ball|chesse))|\bpaneer|\bcurd\b|\byogh?urt|\bdahi\b|\bghee\b(?!.*batti)|\bcream\b.*(fresh|cooking|whipping)|\bfresh cream|\bamul\b|\bdairy\b|\bcondensed|\bmilkmaid|\beveryday\b.*(dairy|whitener)|\banchor\b|\bdds\b|\bsujal|\bchhurpi|\bchurpi`, String.raw`peanut|nacho|noodle|chocolate|choco|cookie|biscuit|crunchy butter|butter ?scotch|icecream|ice cream|kulfi|cleansing|cleasing|jelly|lotion|seasoning|masala|popcorn|cracker|crackers|toast|soan papdi|cokies|delite|shake|cake|bathing|soap|nut\b|dairy$|mini dairy|a5 dairy|mac&cheese`),
  r('dairy-frozen', 'Bread, Cakes & Bakery', String.raw`\bbread\b|\bbun\b|\bbuns\b|\bpav\b|\bcake\b|\bcakes\b|\bmuffin|\bcroissant|\bdonut|\bdoughnut|\brusk\b|\brusks\b|\btoast\b|\bpastry|\bbrownie|\bswiss roll|\bcupcake|\bbakery|\bpie\b|\bchoco ?pie|\bwafer roll|\bteacake`),
  r('dairy-frozen', 'Eggs & Meat', String.raw`\beggs?\b(?!.*(boiler|noodle))|\bchicken\b(?!.*(masala|noodle|soup|curry|flavou?r|chips|stock|cube|pickle|achar|sukuti|momo|bite|kurkure|chowmein|ramen|nugget))|\bmutton\b(?!.*(masala|khurak))|\bfish\b(?!.*(masala|finger|chop|chhop|chope|pickle))|\bmeat\b|\bprawn|\bpork\b|\bbuff\b(?!.*(sukuti|masala))`, String.raw`masala|jerky|khurak|prawn|cracker|instant fish|onion rings|boller|essence|sukuti`),

  // ---- Snacks & sweets
  r('snacks', 'Chocolates & Candy', String.raw`chocolate|\bchoco\b|\bchocos\b|\bdairy milk|\bcadbury|\bkit ?kat|\bkitkat|\bsnickers|\bmars\b|\bbounty|\btwix|\bmunch\b|\bperk\b|\b5 ?star|\bfive star|\bgems\b|\bferrero|\braffaello|\brocher|\bkinder|\bhershey|\btoblerone|\bgalaxy|\bmilky ?bar|\bamul (choco|dark)|\bdark chocolate|\bcandy|\bcandies|\btoffee|\beclairs?|\blollipop|\blolly|\bchupa|\bgum\b(?!.*(stick|bottle|glue))|\bchewing|\bbubble ?gum|\bcenter ?fresh|\bcentre ?fruit|\bmentos|\balpenliebe|\bpulse\b|\bkaccha mango|\bmango bite|\bpoppins|\bjelly\b(?!.*(petroleum|drink))|\bgelly|\bgummy|\bgummies|\bmarshmallow|\bmint\b(?!.*(face|wash|tooth|lemon|masala|soap|cool|mojito))|\bmints\b|\bpolo\b|\bsweets?\b(?!.*corn)|\bmithai|\bladdu|\bladoo|\bbarfi|\brasgulla|\bgulab jamun|\bsoan ?papdi|\bpeda\b|\bkaju katli|\bhalwa|\bwhite rabb?it|\bxylitol|\blotte\b(?!.*pie)|\bchikki|\bmouth ?freshner|\bmouth ?freshener|\bpass ?pass|\bsupari|\bpan ?masala|\bsaunf|\bmukhwas|\bdisaar|\bnutella|\bhazelnut spread|\bcocomio|\bmunch max|\blacto fun`),
  r('snacks', 'Biscuits & Cookies', String.raw`biscuit|\bbiscut|\bcookie|\bcookies|\bcracker|\bcrackers|\bparle|\bparle-?g\b|\bbritannia|\bgood ?day|\boreo\b|\bmarie\b|\bmarie lite|\bhide ?& ?seek|\bbourbon|\bdigestive|\bmcvities|\bunibic|\bsunfeast|\bdark fantasy|\bpriya ?gold|\bpriyagold|\bbisk ?farm|\bruskit|\bkrackjack|\bmonaco|\b50[- ]?50\b|\bjim ?jam|\bnice time|\bnutri ?choice|\bnutricrunch|\btiger\b|\bbiskut|\bwafer|\bwafers|\bhappy happy|\bcream ?(biscuit|sandwich)|\bkreams?\b|\bbisk\b|\bhilife\b.*(cookie|biscuit|choco plus)|\bgoodlife|\bwell ?bell|\blawrence mills|\bpran\b.*(toast|biscuit)|\bmaearon|\bmacarons?\b|\bshortbread`),
  r('snacks', 'Chips, Namkeen & Snacks', String.raw`\bchips\b|\bcrisps|\blays\b|\blay'?s\b|\bkurkure|\bcheetos|\bdoritos|\bpringles|\buncle chips|\bbingo|\bnamkeen|\bnamkin|\bnamking|\bbhujia|\bbhujiya|\bdalmoth|\bdal ?moth|\bmixture|\bsev\b|\baloo bhujia|\bhaldiram|\bbikaji|\bpuffcorn|\bpuff\b|\bpuffs\b|\bstix\b|\bsticks\b(?!.*(incense|agarbatti|glue|wax))|\bpopcorn|\bnachos|\bcheese balls|\bchesse balls|\bring(s)?\b.*snack|\bsnack|\bsnacks|\b2 ?pm\b|\b123\b|\bcheeseballs|\bpeanuts?\b(?!.*butter)|\bmasala peanut|\bkhaja\b|\bchiura|\bbhuja\b|\bvuja\b|\bmakai\b|\bmakhana|\bfox ?nut|\bpani ?puri|\bgol ?gappe|\bpapad|\bpapadum|\bkeropok|\bprawn cracker|\bwai[- ]?wai\b.*(bhujia|chips|snack)|\bchatpate|\bchatamari|\bchowchow\b|\bsukuti|\bkurmure|\bmuri\b|\bbhel`),

  // ---- Groceries & staples (broadest food words last)
  r('groceries', 'Noodles, Pasta & Soup', String.raw`noodle|\bramen|\bramyun|\bramyeon|\bmaggi|\bwai[- ]?wai|\brara\b|\bmayos|\bpreeti|\b2pm noodles|\bshin\b|\bsamyang|\bbuldak|\bchau ?chau|\bchowmein|\bchow mein|\bpasta\b|\bmacaroni|\bspaghetti|\bvermicelli|\bsevai|\bsemiya|\bsoup\b|\bknorr|\bcup noodle|\bnissin|\btop ramen|\bpenne|\bfusilli|\bindomie|\bmama\b.*noodle`),
  r('groceries', 'Rice & Grains', String.raw`\brice\b(?!.*(cake|cracker|puff|bran oil|water|flour))|\bbasmati|\bchamal|\bjeera masino|\bmansuli|\bsona mansuli|\bpokhareli|\bjasmine|\bsella|\bbeaten rice|\bchiura\b(?!.*(snack|fry))|\bpoha\b|\bdaliya|\bdalia\b|\boats\b(?!.*(biscuit|cookie|bar))|\boat\b|\bquinoa|\bmillet|\bkodo\b|\bfapar|\bbarley|\bjau\b(?!.*pitho)|\bmakai\b(?!.*(khaja|snack))|\bcorn\b(?!.*(flakes|puff|oil|flour|chips|cheese|pop|chewy|sweet kernel))|\bsabudana|\bsago\b|\bhill queen|\bdaawat|\bindia gate|\bkohinoor|\bgolden sella|\bmansoori`),
  r('groceries', 'Atta, Flour & Sooji', String.raw`\batta\b|\baata\b|\bflour\b|\bmaida\b|\bsooji|\bsuji\b|\brawa\b|\bsemolina|\bbesan\b|\bbeshan|\bgram flour|\bpitho\b|\bpitho|\bcorn flour|\bcornflour|\bcorn starch|\bmakai ko pitho|\bfapar ko pitho|\bmaas pitho|\bmass pitho|\bmultigrain|\bchakki|\bmangalam aata|\bshaktibhog|\baashirvaad`),
  r('groceries', 'Dal & Pulses', String.raw`\bdal\b(?!.*(moth|mixture|biji))|\bdaal\b|\blentil|\bmasoor|\bmoong|\bmung\b|\bchana\b|\bchickpea|\bkabuli|\brajma|\bkidney bean|\bbeans?\b(?!.*(coffee|baked|jelly))|\btoor\b|\barhar\b|\burad\b|\bmas\b|\bkalo mas|\bgahat|\bbodi\b|\brato bodi|\bkerau|\bkeraw|\bpeas\b(?!.*frozen)|\bmattar|\bmatar\b|\bsoya(bean)?\b(?!.*(sauce|oil|chunk|chunks|nuggets))|\bbhatmas|\bmasyaura|\bmaseura|\bgundruk`),
  r('groceries', 'Oil & Ghee', String.raw`\boil\b(?!.*(hair|body|massage|baby|face|lip|essential|engine|coconut oil \d+ ?ml|amla|almond hair|kesh|hot oil|olive oil.*(hair|skin)|7 ?oils|nail|beard|castor|onion hair))|\bmustard oil|\bsunflower oil|\bsoyabean oil|\bsoybean oil|\brice bran|\bpalm oil|\bolive oil|\bcanola|\bgroundnut oil|\bvanaspati|\bdalda|\bghee\b|\bfortune\b|\bdhara\b|\bsaffola|\bgemini oil|\bsuncrest|\btarai\b|\bamar\b.*oil|\bpashupati oil|\bdhulikhel|\bnoon\b.*oil`),
  r('groceries', 'Spices & Masala', String.raw`masala|mashala|\bspice|\bhaldi|\bturmeric|\bjeera|\bcumin|\bdhaniya|\bdhania|\bcoriander|\bchilli|\bchili\b|\bkhursani|\bmarich|\bpepper\b|\bgaram|\bmethi\b|\bfenugreek|\bjwano|\bajwain|\bajwan|\bmustard seed|\bsarson|\bsaunf|\bfennel|\blwang|\bclove|\bsukmel|\bcardamom|\belaichi|\bdalchini|\bcinnamon|\btejpat|\bbay leaf|\btimur|\bszechuan|\bhing\b|\basafoetida|\bkesar|\bsaffron|\bmace\b|\bjaiphal|\bnutmeg|\bkasuri|\broyal\b.*(ginger|timur|pouder|powder)|\bginger\b(?!.*(ale|biscuit))|\bgarlic\b(?!.*(press|bread))|\bkalo nun|\bbire nun|\bsiddhi vinayak|\btadka|\bchaat|\bchat masala|\bpav bhaji|\bcurry\b(?!.*noodle)|\bmeat masala|\bsabji|\bkhurak|\bmutton khurak|\bjimmu|\bjimbu|\bdhikka`),
  r('groceries', 'Salt, Sugar & Jaggery', String.raw`\bsalt\b|\bnun\b|\biodized|\bsugar\b(?!.*(free|cracker|biscuit|lip|scrub|coated))|\bchini\b|\bjaggery|\bgud\b|\bchaku\b|\bmishri|\bmisri|\bbrown sugar|\bsugar cube|\bsweetener|\bstevia|\bsugar ?free\b(?!.*(biscuit|cracker|cookie))`),
  r('groceries', 'Dry Fruits, Nuts & Seeds', String.raw`\bdry ?fruit|\bcashew|\bkaju\b|\balmond\b(?!.*(oil|hair|drops|cream))|\bbadam\b(?!.*(oil|hair))|\bpista|\bpistachio|\bwalnut|\bwallnut|\bokhar|\braisin|\bkishmish|\bkismis|\bdates\b|\bkhajur|\bkhajoor|\bfig\b|\banjeer|\bapricot|\bprune|\bmixed nuts?|\bmix nut|\btrail mix|\bnuts\b|\bseeds?\b(?!.*basil)|\bflax|\bchia\b|\bsunflower seed|\bpumpkin seed|\bpumkin seed|\bmelon seed|\bmakhana\b(?!.*(masala|peri|snack))|\bchironji|\bcoconut\b(?!.*(oil|water|cookie|biscuit|milk))|\bkhuwa|\bdry fish`),
  r('groceries', 'Sauces, Pickles & Spreads', String.raw`\bsauce\b|\bsause\b|\bketchup|\bmayo|\bmayonnaise|\bvinegar|\bsoy ?sauce|\bchilli sauce|\bhot sauce|\btabasco|\bsriracha|\bpickle\b|\bachar\b|\bachaar|\bchutney|\bchhop|\bchope\b|\bchop\b|\bjam\b|\bjams\b|\bmarmalade|\bhoney\b.*(spread|squeeze)|\bpeanut butter|\bspread\b|\bnutella|\bdip\b|\bsalsa|\bmustard (sauce|paste)|\bpaste\b(?!.*tooth)|\bginger garlic paste|\bpuree|\bkissan|\bmaggi (ketchup|sauce)|\bveeba|\bfunfoods|\bdr\.? oetker|\bsyrup\b.*(chocolate|maple|strawberry)|\bmaple|\bgulkand|\bmurabba`),
  r('groceries', 'Breakfast & Cereals', String.raw`corn ?flakes|\bcereal|\bmuesli|\bgranola|\bchocos\b|\bkellogg|\bsaffola oats|\bquaker|\boats\b|\bwheat flakes|\bhoney loops|\bcoco pops|\bfills\b|\bpeanut butter|\bchyawan`),
  r('groceries', 'Cooking Essentials', String.raw`\bbaking (soda|powder)|\bcooking soda|\byeast|\bcustard|\bjelly (powder|crystal)|\bessence|\bfood colou?r|\bcocoa\b|\bgelatin|\bagar|\bvanilla|\bstock cube|\bmaggi (cube|masala|magic)|\bmagic cube|\bready to (eat|cook)|\bready mix|\binstant (mix|meal)|\bgulab jamun mix|\bidli mix|\bdosa mix|\bpakora mix|\bmix\b.*(instant|meal)|\bpaneer\b.*mix|\bmomo\b(?!.*frozen)|\bmo\.?mo\b|\bcanned|\btin(ned)?\b|\bbaked beans|\bsweet (corn|kernel)|\bkernel corn|\bmushroom\b|\bgreen peas|\bposhillo|\bsatu instant|\bsoup powder|\bpapad\b|\bsoya chunk|\bnutrela|\bnuggets\b.*soya|\bsoya ?(bari|badi|chunks|granules)|\bmeal maker|\bvermicelli`),
  r('groceries', 'Fruits & Vegetables', String.raw`\bfresh (fruit|vegetable|apple|banana)|\bapple\b(?!.*(juice|cider|drink|flav))|\bbanana|\bmango\b(?!.*(juice|drink|bite|kulfi|pickle|achar|crush))|\borange\b(?!.*(juice|drink|flv|flav|candy))|\bpotato\b(?!.*(chips|biscuit|biscut|snack))|\bonion\b(?!.*(oil|hair|chips|flav|shampoo))|\btomato\b(?!.*(sauce|ketchup|chips|soup|flav))|\bvegetable\b(?!.*(cutter|chopper|oil|soup|masala|basket|nibble))|\blemon\b(?!.*(juice|drink|flv|squeez|mint|tea|face|soda))|\bgreen chilli`),
  // ---- Last resort: brands that mostly sell spices
  r('groceries', 'Spices & Masala', String.raw`\bmdh\b|\beverest\b|\bcatch\b|\bsarathi\b|\bsiddhu|\bcentury\b|\bsuper ?grow|\bmisty\b|\bfirst choice\b|\broyal\b`),
];

/** Maps the category given in the store's spreadsheet to our taxonomy (used when no rule matches). */
export const FALLBACK = {
  'Alcoholic Beverages': ['liquor-smoking', 'Whisky, Rum & Spirits'],
  'Automotive & Utility': ['home-living', 'Tools, Hardware & Auto'],
  'Baby Care': ['baby-care', 'Baby Accessories'],
  'Beverages': ['beverages', 'Soft Drinks & Soda'],
  'Dairy & Chilled Foods': ['dairy-frozen', 'Milk, Butter & Cheese'],
  'Electronics & Appliances': ['electronics', 'Appliances & Gadgets'],
  'Fashion & Accessories': ['ladies-wear', 'Clothing'],
  'Festive & Gift': ['gifts-puja', 'Gifts & Party'],
  'Fresh & Dry Foods': ['groceries', 'Dry Fruits, Nuts & Seeds'],
  'Grocery & Staples': ['groceries', 'Cooking Essentials'],
  'Health & Wellness': ['health-hygiene', 'Health & Wellness'],
  'Home & Storage': ['home-living', 'Storage & Organisers'],
  'Household Cleaning': ['cleaning', 'Floor, Toilet & Glass Cleaners'],
  'Kitchen & Dining': ['kitchen-household', 'Kitchen Tools'],
  'Personal Care & Beauty': ['beauty-skincare', 'Skin Care'],
  'Pet Care': ['pet-care', 'Pet Food & Accessories'],
  'Sauces, Spreads & Preserves': ['groceries', 'Sauces, Pickles & Spreads'],
  'Smoking Accessories': ['liquor-smoking', 'Hookah & Smoking'],
  'Snacks & Confectionery': ['snacks', 'Chips, Namkeen & Snacks'],
  'Sports & Outdoor': ['toys', 'Sports & Fitness'],
  'Stationery & School Supplies': ['stationery', 'School & Office Supplies'],
  'Toys & Kids': ['toys', 'Toys'],
};

/** Words that rule a whole category out, whatever rule matched (e.g. a "whisky glass" is not liquor). */
const CATEGORY_NOT = {
  'liquor-smoking': /glass|\bmug\b|vinegar|face ?wash|body ?wash|soap|shampoo|gas lighter|opener|colgate/,
  'beauty-skincare': /chips|cookie|cracker|biscuit|wafer|\bbar\b.*\d+ ?g/,
  toys: /\d+ ?ml\b|massager|choco|toilet|shampoo|menthol|biscuit/,
  'ladies-wear': /biscuit|cracker|cookie|crush|\d+ ?ml\b|bath belt|birthday/,
  electronics: /tooth ?pick|glass bowl|apron|towel|shower cap/,
  'gifts-puja': /sausage|momo|salami|nugget|rice|corn|meatball|tikki|patch|peas/,
};

export function classify(name, sheetCategory) {
  const n = ` ${name.toLowerCase().replace(/\s+/g, ' ')} `;
  for (const rule of RULES) if (rule.re.test(n) && !rule.not?.test(n) && !CATEGORY_NOT[rule.cat]?.test(n)) return { cat: rule.cat, sub: rule.sub, matched: true };
  const fb = FALLBACK[sheetCategory];
  if (fb) return { cat: fb[0], sub: fb[1], matched: false };
  return { cat: 'home-living', sub: 'Everyday Essentials', matched: false };
}
