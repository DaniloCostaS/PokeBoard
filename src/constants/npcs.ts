export const NPC_DATA: Record<number, {name: string, gold: number, team: number[], img: string}> = {
    // --- GERAÇÃO 1 (Kanto) ---
    7: { name: "Rocket Grunt", gold: 300, team: [52, 41, 109, 23], img: "Rocket.jpg" }, 
    8: { name: "Motoqueiro", gold: 250, team: [56, 21, 104], img: "Motoqueiro.jpg" }, 
    9: { name: "Jovem", gold: 200, team: [10, 19, 25, 29, 32], img: "Jovem.jpg" }, 
    10: { name: "Velho", gold: 350, team: [58, 37, 126, 128, 129], img: "Velho.jpg" }, 

    // --- GERAÇÃO 2 (Johto) ---
    11: { name: "Caçador de Insetos", gold: 200, team: [165, 167, 193, 204, 214], img: "CaçadorInsetos.jpg" },
    12: { name: "Nadador", gold: 250, team: [170, 183, 194, 211, 222], img: "Nadador.jpg" }, 
    13: { name: "Garota Kimono", gold: 350, team: [196, 197, 234, 241, 235], img: "KimonoGirl.jpg" }, 
    14: { name: "Rival Johto", gold: 400, team: [169, 212, 227, 228, 246], img: "RivalJohto.jpg" }, 

    // --- GERAÇÃO 3 (Hoenn) ---
    15: { name: "Capanga Aqua", gold: 300, team: [261, 318, 320, 341], img: "TeamAqua.jpg" }, 
    16: { name: "Capanga Magma", gold: 300, team: [261, 322, 324, 336], img: "TeamMagma.jpg" }, 
    17: { name: "Montanhista", gold: 250, team: [293, 299, 304, 328], img: "Montanhista.jpg" }, 
    18: { name: "Schoolboy", gold: 400, team: [280, 287, 309, 359, 371], img: "Schoolboy.jpg" } 
};