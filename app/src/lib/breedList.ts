// GENERADO junto con supabase/migrations/0016_breeds.sql: la misma lista de razas (id canónico, especie, etiqueta, peso típico y alias).
// Si se cambia una, hay que cambiar la otra.
import type { Species } from "./database.types";

export type Breed = { id: string; species: Species; label: string; weightKg: number | null; aliases: string[] };

export const BREEDS: Breed[] = [
 {
  "id": "chihuahua",
  "species": "dog",
  "label": "Chihuahua",
  "weightKg": 2.5,
  "aliases": []
 },
 {
  "id": "yorkshire-terrier",
  "species": "dog",
  "label": "Yorkshire Terrier",
  "weightKg": 3.0,
  "aliases": [
   "yorkshire",
   "yorkie"
  ]
 },
 {
  "id": "pomeranian",
  "species": "dog",
  "label": "Pomeranian",
  "weightKg": 3.0,
  "aliases": []
 },
 {
  "id": "maltese",
  "species": "dog",
  "label": "Maltese",
  "weightKg": 3.0,
  "aliases": []
 },
 {
  "id": "papillon",
  "species": "dog",
  "label": "Papillon",
  "weightKg": 4.0,
  "aliases": []
 },
 {
  "id": "miniature-pinscher",
  "species": "dog",
  "label": "Miniature Pinscher",
  "weightKg": 4.0,
  "aliases": [
   "min pin"
  ]
 },
 {
  "id": "toy-poodle",
  "species": "dog",
  "label": "Toy Poodle",
  "weightKg": 3.5,
  "aliases": []
 },
 {
  "id": "pekingese",
  "species": "dog",
  "label": "Pekingese",
  "weightKg": 5.0,
  "aliases": [
   "pequines",
   "pekinese"
  ]
 },
 {
  "id": "havanese",
  "species": "dog",
  "label": "Havanese",
  "weightKg": 5.0,
  "aliases": []
 },
 {
  "id": "bichon-frise",
  "species": "dog",
  "label": "Bichon Frise",
  "weightKg": 6.0,
  "aliases": [
   "bichon"
  ]
 },
 {
  "id": "shih-tzu",
  "species": "dog",
  "label": "Shih Tzu",
  "weightKg": 6.0,
  "aliases": [
   "shihtzu"
  ]
 },
 {
  "id": "lhasa-apso",
  "species": "dog",
  "label": "Lhasa Apso",
  "weightKg": 6.0,
  "aliases": []
 },
 {
  "id": "cairn-terrier",
  "species": "dog",
  "label": "Cairn Terrier",
  "weightKg": 6.0,
  "aliases": []
 },
 {
  "id": "rat-terrier",
  "species": "dog",
  "label": "Rat Terrier",
  "weightKg": 6.0,
  "aliases": []
 },
 {
  "id": "jack-russell-terrier",
  "species": "dog",
  "label": "Jack Russell Terrier",
  "weightKg": 6.5,
  "aliases": [
   "jack russell"
  ]
 },
 {
  "id": "miniature-schnauzer",
  "species": "dog",
  "label": "Miniature Schnauzer",
  "weightKg": 7.0,
  "aliases": [
   "mini schnauzer"
  ]
 },
 {
  "id": "miniature-poodle",
  "species": "dog",
  "label": "Miniature Poodle",
  "weightKg": 7.0,
  "aliases": []
 },
 {
  "id": "cavalier-king-charles-spaniel",
  "species": "dog",
  "label": "Cavalier King Charles Spaniel",
  "weightKg": 7.0,
  "aliases": [
   "cavalier"
  ]
 },
 {
  "id": "pug",
  "species": "dog",
  "label": "Pug",
  "weightKg": 8.0,
  "aliases": []
 },
 {
  "id": "boston-terrier",
  "species": "dog",
  "label": "Boston Terrier",
  "weightKg": 8.0,
  "aliases": []
 },
 {
  "id": "dachshund",
  "species": "dog",
  "label": "Dachshund",
  "weightKg": 9.0,
  "aliases": [
   "salchicha",
   "wiener"
  ]
 },
 {
  "id": "west-highland-white-terrier",
  "species": "dog",
  "label": "West Highland White Terrier",
  "weightKg": 9.0,
  "aliases": [
   "westie",
   "west highland"
  ]
 },
 {
  "id": "scottish-terrier",
  "species": "dog",
  "label": "Scottish Terrier",
  "weightKg": 9.0,
  "aliases": []
 },
 {
  "id": "shiba-inu",
  "species": "dog",
  "label": "Shiba Inu",
  "weightKg": 10.0,
  "aliases": [
   "shiba"
  ]
 },
 {
  "id": "basenji",
  "species": "dog",
  "label": "Basenji",
  "weightKg": 10.0,
  "aliases": []
 },
 {
  "id": "beagle",
  "species": "dog",
  "label": "Beagle",
  "weightKg": 11.0,
  "aliases": []
 },
 {
  "id": "french-bulldog",
  "species": "dog",
  "label": "French Bulldog",
  "weightKg": 12.0,
  "aliases": [
   "frenchie"
  ]
 },
 {
  "id": "corgi",
  "species": "dog",
  "label": "Corgi",
  "weightKg": 12.0,
  "aliases": [
   "pembroke"
  ]
 },
 {
  "id": "whippet",
  "species": "dog",
  "label": "Whippet",
  "weightKg": 12.0,
  "aliases": []
 },
 {
  "id": "cocker-spaniel",
  "species": "dog",
  "label": "Cocker Spaniel",
  "weightKg": 13.0,
  "aliases": []
 },
 {
  "id": "staffordshire-terrier",
  "species": "dog",
  "label": "Staffordshire Terrier",
  "weightKg": 15.0,
  "aliases": [
   "staffordshire",
   "staffy"
  ]
 },
 {
  "id": "brittany",
  "species": "dog",
  "label": "Brittany",
  "weightKg": 16.0,
  "aliases": []
 },
 {
  "id": "australian-cattle-dog",
  "species": "dog",
  "label": "Australian Cattle Dog",
  "weightKg": 18.0,
  "aliases": [
   "cattle dog",
   "blue heeler"
  ]
 },
 {
  "id": "border-collie",
  "species": "dog",
  "label": "Border Collie",
  "weightKg": 19.0,
  "aliases": []
 },
 {
  "id": "poodle",
  "species": "dog",
  "label": "Poodle",
  "weightKg": 20.0,
  "aliases": []
 },
 {
  "id": "australian-shepherd",
  "species": "dog",
  "label": "Australian Shepherd",
  "weightKg": 22.0,
  "aliases": [
   "aussie"
  ]
 },
 {
  "id": "siberian-husky",
  "species": "dog",
  "label": "Siberian Husky",
  "weightKg": 22.0,
  "aliases": [
   "husky"
  ]
 },
 {
  "id": "samoyed",
  "species": "dog",
  "label": "Samoyed",
  "weightKg": 22.0,
  "aliases": []
 },
 {
  "id": "shar-pei",
  "species": "dog",
  "label": "Shar Pei",
  "weightKg": 22.0,
  "aliases": []
 },
 {
  "id": "english-springer-spaniel",
  "species": "dog",
  "label": "English Springer Spaniel",
  "weightKg": 22.0,
  "aliases": [
   "springer spaniel"
  ]
 },
 {
  "id": "bulldog",
  "species": "dog",
  "label": "Bulldog",
  "weightKg": 24.0,
  "aliases": [
   "english bulldog"
  ]
 },
 {
  "id": "pit-bull",
  "species": "dog",
  "label": "Pit Bull",
  "weightKg": 25.0,
  "aliases": [
   "pitbull"
  ]
 },
 {
  "id": "basset-hound",
  "species": "dog",
  "label": "Basset Hound",
  "weightKg": 25.0,
  "aliases": [
   "basset"
  ]
 },
 {
  "id": "collie",
  "species": "dog",
  "label": "Collie",
  "weightKg": 25.0,
  "aliases": []
 },
 {
  "id": "chow-chow",
  "species": "dog",
  "label": "Chow Chow",
  "weightKg": 25.0,
  "aliases": []
 },
 {
  "id": "dalmatian",
  "species": "dog",
  "label": "Dalmatian",
  "weightKg": 25.0,
  "aliases": []
 },
 {
  "id": "airedale-terrier",
  "species": "dog",
  "label": "Airedale Terrier",
  "weightKg": 25.0,
  "aliases": [
   "airedale"
  ]
 },
 {
  "id": "bull-terrier",
  "species": "dog",
  "label": "Bull Terrier",
  "weightKg": 25.0,
  "aliases": []
 },
 {
  "id": "standard-poodle",
  "species": "dog",
  "label": "Standard Poodle",
  "weightKg": 25.0,
  "aliases": []
 },
 {
  "id": "pointer",
  "species": "dog",
  "label": "Pointer",
  "weightKg": 25.0,
  "aliases": []
 },
 {
  "id": "english-setter",
  "species": "dog",
  "label": "English Setter",
  "weightKg": 28.0,
  "aliases": [
   "setter"
  ]
 },
 {
  "id": "belgian-malinois",
  "species": "dog",
  "label": "Belgian Malinois",
  "weightKg": 28.0,
  "aliases": [
   "malinois"
  ]
 },
 {
  "id": "vizsla",
  "species": "dog",
  "label": "Vizsla",
  "weightKg": 27.0,
  "aliases": []
 },
 {
  "id": "labrador-retriever",
  "species": "dog",
  "label": "Labrador Retriever",
  "weightKg": 30.0,
  "aliases": [
   "labrador",
   "lab"
  ]
 },
 {
  "id": "golden-retriever",
  "species": "dog",
  "label": "Golden Retriever",
  "weightKg": 30.0,
  "aliases": [
   "golden"
  ]
 },
 {
  "id": "boxer",
  "species": "dog",
  "label": "Boxer",
  "weightKg": 30.0,
  "aliases": []
 },
 {
  "id": "greyhound",
  "species": "dog",
  "label": "Greyhound",
  "weightKg": 30.0,
  "aliases": []
 },
 {
  "id": "weimaraner",
  "species": "dog",
  "label": "Weimaraner",
  "weightKg": 32.0,
  "aliases": []
 },
 {
  "id": "german-shepherd",
  "species": "dog",
  "label": "German Shepherd",
  "weightKg": 34.0,
  "aliases": [
   "pastor aleman",
   "alsatian"
  ]
 },
 {
  "id": "doberman",
  "species": "dog",
  "label": "Doberman",
  "weightKg": 36.0,
  "aliases": [
   "doberman pinscher"
  ]
 },
 {
  "id": "akita",
  "species": "dog",
  "label": "Akita",
  "weightKg": 38.0,
  "aliases": []
 },
 {
  "id": "alaskan-malamute",
  "species": "dog",
  "label": "Alaskan Malamute",
  "weightKg": 38.0,
  "aliases": [
   "malamute"
  ]
 },
 {
  "id": "bloodhound",
  "species": "dog",
  "label": "Bloodhound",
  "weightKg": 40.0,
  "aliases": []
 },
 {
  "id": "bernese-mountain-dog",
  "species": "dog",
  "label": "Bernese Mountain Dog",
  "weightKg": 42.0,
  "aliases": [
   "bernese"
  ]
 },
 {
  "id": "rottweiler",
  "species": "dog",
  "label": "Rottweiler",
  "weightKg": 45.0,
  "aliases": [
   "rottie"
  ]
 },
 {
  "id": "cane-corso",
  "species": "dog",
  "label": "Cane Corso",
  "weightKg": 45.0,
  "aliases": []
 },
 {
  "id": "great-pyrenees",
  "species": "dog",
  "label": "Great Pyrenees",
  "weightKg": 45.0,
  "aliases": []
 },
 {
  "id": "great-dane",
  "species": "dog",
  "label": "Great Dane",
  "weightKg": 60.0,
  "aliases": []
 },
 {
  "id": "newfoundland",
  "species": "dog",
  "label": "Newfoundland",
  "weightKg": 60.0,
  "aliases": []
 },
 {
  "id": "saint-bernard",
  "species": "dog",
  "label": "Saint Bernard",
  "weightKg": 70.0,
  "aliases": [
   "st bernard"
  ]
 },
 {
  "id": "mastiff",
  "species": "dog",
  "label": "Mastiff",
  "weightKg": 75.0,
  "aliases": []
 },
 {
  "id": "domestic-shorthair",
  "species": "cat",
  "label": "Domestic Shorthair",
  "weightKg": null,
  "aliases": []
 },
 {
  "id": "domestic-longhair",
  "species": "cat",
  "label": "Domestic Longhair",
  "weightKg": null,
  "aliases": []
 },
 {
  "id": "siamese",
  "species": "cat",
  "label": "Siamese",
  "weightKg": null,
  "aliases": []
 },
 {
  "id": "persian",
  "species": "cat",
  "label": "Persian",
  "weightKg": null,
  "aliases": []
 },
 {
  "id": "maine-coon",
  "species": "cat",
  "label": "Maine Coon",
  "weightKg": null,
  "aliases": []
 },
 {
  "id": "ragdoll",
  "species": "cat",
  "label": "Ragdoll",
  "weightKg": null,
  "aliases": []
 },
 {
  "id": "bengal",
  "species": "cat",
  "label": "Bengal",
  "weightKg": null,
  "aliases": []
 },
 {
  "id": "british-shorthair",
  "species": "cat",
  "label": "British Shorthair",
  "weightKg": null,
  "aliases": []
 },
 {
  "id": "american-shorthair",
  "species": "cat",
  "label": "American Shorthair",
  "weightKg": null,
  "aliases": []
 },
 {
  "id": "exotic-shorthair",
  "species": "cat",
  "label": "Exotic Shorthair",
  "weightKg": null,
  "aliases": []
 },
 {
  "id": "oriental-shorthair",
  "species": "cat",
  "label": "Oriental Shorthair",
  "weightKg": null,
  "aliases": []
 },
 {
  "id": "sphynx",
  "species": "cat",
  "label": "Sphynx",
  "weightKg": null,
  "aliases": []
 },
 {
  "id": "russian-blue",
  "species": "cat",
  "label": "Russian Blue",
  "weightKg": null,
  "aliases": []
 },
 {
  "id": "scottish-fold",
  "species": "cat",
  "label": "Scottish Fold",
  "weightKg": null,
  "aliases": []
 },
 {
  "id": "abyssinian",
  "species": "cat",
  "label": "Abyssinian",
  "weightKg": null,
  "aliases": []
 },
 {
  "id": "birman",
  "species": "cat",
  "label": "Birman",
  "weightKg": null,
  "aliases": []
 },
 {
  "id": "burmese",
  "species": "cat",
  "label": "Burmese",
  "weightKg": null,
  "aliases": []
 },
 {
  "id": "balinese",
  "species": "cat",
  "label": "Balinese",
  "weightKg": null,
  "aliases": []
 },
 {
  "id": "himalayan",
  "species": "cat",
  "label": "Himalayan",
  "weightKg": null,
  "aliases": []
 },
 {
  "id": "norwegian-forest",
  "species": "cat",
  "label": "Norwegian Forest",
  "weightKg": null,
  "aliases": []
 },
 {
  "id": "siberian-cat",
  "species": "cat",
  "label": "Siberian",
  "weightKg": null,
  "aliases": []
 },
 {
  "id": "turkish-angora",
  "species": "cat",
  "label": "Turkish Angora",
  "weightKg": null,
  "aliases": []
 },
 {
  "id": "devon-rex",
  "species": "cat",
  "label": "Devon Rex",
  "weightKg": null,
  "aliases": []
 },
 {
  "id": "cornish-rex",
  "species": "cat",
  "label": "Cornish Rex",
  "weightKg": null,
  "aliases": []
 },
 {
  "id": "tonkinese",
  "species": "cat",
  "label": "Tonkinese",
  "weightKg": null,
  "aliases": []
 },
 {
  "id": "savannah",
  "species": "cat",
  "label": "Savannah",
  "weightKg": null,
  "aliases": []
 },
 {
  "id": "ragamuffin",
  "species": "cat",
  "label": "Ragamuffin",
  "weightKg": null,
  "aliases": []
 },
 {
  "id": "manx",
  "species": "cat",
  "label": "Manx",
  "weightKg": null,
  "aliases": []
 }
];
