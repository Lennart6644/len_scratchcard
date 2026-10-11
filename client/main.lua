local uiOpen = false

local function maxPrize(card)
    local max = 0
    for _, win in ipairs(card.wins) do
        if win.amount > max then
            max = win.amount
        end
    end
    return max
end

local function closeUI()
    if not uiOpen then return end
    uiOpen = false
    SetNuiFocus(false, false)
    TriggerServerEvent('esx_scratchcard:close')
end

RegisterNetEvent('esx_scratchcard:open', function(cardName, prize)
    local card = Config.Scratchcards[cardName]
    if not card or uiOpen then return end

    uiOpen = true
    SetNuiFocus(true, true)

    SendNUIMessage({
        action = 'open',
        lang = Config.Locale,
        card = {
            label = card.label,
            accent = card.accent,
            design = card.design,
            maxPrize = maxPrize(card),
        },
        prize = prize,
        threshold = Config.ScratchThreshold,
        brush = Config.BrushSize,
        sampleInterval = Config.SampleInterval,
        window = Config.Window,
        sound = Config.Sound,
        confetti = Config.Confetti,
        strings = Locale.ui(),
    })
end)

RegisterNUICallback('reveal', function(_, cb)
    TriggerServerEvent('esx_scratchcard:claim')
    cb('ok')
end)

RegisterNUICallback('close', function(_, cb)
    closeUI()
    cb('ok')
end)

AddEventHandler('onResourceStop', function(resource)
    if resource == GetCurrentResourceName() then
        SetNuiFocus(false, false)
    end
end)
