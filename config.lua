Config = {}

Config.Locale = 'en' -- en or de
Config.ScratchThreshold = 0.70
Config.BrushSize = 44
Config.SampleInterval = 120

Config.Window = {
    x = 10,
    y = 28,
    width = 80,
    height = 46
}

Config.Sound = {
    enabled = true,
    volume = 0.6
}

Config.Confetti = {
    enabled = true,
    pieces = 90,
    minPrizeRatio = 0.25
}

Config.Scratchcards = {
    scratch_bronze = {
        label = 'BRONZE',
        accent = '#d08a3c',
        design = {
            background = { '#3b2212', '#8a4f22' },
            border = '#e0a060',
            titleColor = '#ffd7a8',
            motif = '#e8a25a',
            pattern = 'coins',
            rays = false,
            windowBackground = { '#24140a', '#4a2a14' },
            prizeColor = '#ffd7a8',
        },
        wins = {
            { amount = 0, chance = 12 },
            { amount = 50, chance = 28 },
            { amount = 125, chance = 28 },
            { amount = 200, chance = 20 },
            { amount = 500, chance = 10 },
            { amount = 1000, chance = 2 },
        },
    },

    scratch_silver = {
        label = 'SILVER',
        accent = '#c3c9d0',
        design = {
            background = { '#2a2f36', '#7b848f' },
            border = '#e8edf2',
            titleColor = '#ffffff',
            motif = '#f2f5f8',
            pattern = 'stars',
            rays = true,
            windowBackground = { '#14171c', '#2d333b' },
            prizeColor = '#f2f5f8',
        },
        wins = {
            { amount = 0, chance = 10 },
            { amount = 125, chance = 15 },
            { amount = 250, chance = 22 },
            { amount = 600, chance = 28 },
            { amount = 750, chance = 15 },
            { amount = 1500, chance = 9 },
            { amount = 5000, chance = 1 },
        },
    },

    scratch_gold = {
        label = 'GOLD',
        accent = '#f5c542',
        design = {
            background = { '#5c3d00', '#f0b800' },
            border = '#fff3a6',
            titleColor = '#fff7cc',
            motif = '#ffe066',
            pattern = 'bars',
            rays = true,
            windowBackground = { '#2b1d00', '#5a3d05' },
            prizeColor = '#ffe066',
        },
        wins = {
            { amount = 0, chance = 10 },
            { amount = 250, chance = 15 },
            { amount = 500, chance = 22 },
            { amount = 1250, chance = 28 },
            { amount = 1500, chance = 15 },
            { amount = 3000, chance = 9 },
            { amount = 10000, chance = 1 },
        },
    },

    scratch_emerald = {
        label = 'EMERALD',
        accent = '#2ecc71',
        design = {
            background = { '#03301a', '#12a150' },
            border = '#9dffc4',
            titleColor = '#e6fff0',
            motif = '#5cff9a',
            pattern = 'clover',
            rays = true,
            windowBackground = { '#021a0e', '#0b3d22' },
            prizeColor = '#7dffa0',
        },
        wins = {
            { amount = 0, chance = 12 },
            { amount = 3500, chance = 30 },
            { amount = 5250, chance = 28 },
            { amount = 8000, chance = 12 },
            { amount = 10000, chance = 8 },
            { amount = 15000, chance = 7 },
            { amount = 20000, chance = 3 },
        },
    },

    scratch_diamond = {
        label = 'DIAMOND',
        accent = '#4aa8ff',
        design = {
            background = { '#06163a', '#1e6fd9' },
            border = '#b9e6ff',
            titleColor = '#ffffff',
            motif = '#8fd3ff',
            pattern = 'diamonds',
            rays = true,
            windowBackground = { '#050e24', '#102a5c' },
            prizeColor = '#8fd3ff',
        },
        wins = {
            { amount = 0, chance = 18 },
            { amount = 5000, chance = 20 },
            { amount = 10500, chance = 22 },
            { amount = 15000, chance = 17 },
            { amount = 20000, chance = 12 },
            { amount = 30000, chance = 7 },
            { amount = 40000, chance = 4 },
        },
    },
}
