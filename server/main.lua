ESX = nil
local pending = {}

local function notify(src, key, ...)
    TriggerClientEvent('esx:showNotification', src, Locale.notify(key, ...))
end

local function rollPrize(card)
    local roll = math.random(1, 100)
    local cumulative = 0
    for _, win in ipairs(card.wins) do
        cumulative = cumulative + win.chance
        if roll <= cumulative then
            return win.amount
        end
    end
    return 0
end

local function payout(src, data)
    if data.claimed then return end
    data.claimed = true

    local xPlayer = ESX.GetPlayerFromId(src)
    if not xPlayer then return end

    if data.amount > 0 then
        xPlayer.addMoney(data.amount)
        notify(src, 'won', data.amount)
    else
        notify(src, 'lost')
    end
end

local function useCard(src, cardName)
    if pending[src] then
        notify(src, 'already_open')
        return
    end

    local xPlayer = ESX.GetPlayerFromId(src)
    if not xPlayer then return end

    local item = xPlayer.getInventoryItem(cardName)
    if not item or item.count < 1 then return end

    xPlayer.removeInventoryItem(cardName, 1)

    local prize = rollPrize(Config.Scratchcards[cardName])
    pending[src] = { card = cardName, amount = prize, claimed = false }

    TriggerClientEvent('esx_scratchcard:open', src, cardName, prize)
end

CreateThread(function()
    while ESX == nil do
        TriggerEvent('esx:getSharedObject', function(obj) ESX = obj end)
        Wait(100)
    end

    for cardName in pairs(Config.Scratchcards) do
        ESX.RegisterUsableItem(cardName, function(source)
            useCard(source, cardName)
        end)
    end
end)

RegisterNetEvent('esx_scratchcard:claim', function()
    local src = source
    local data = pending[src]
    if data then
        payout(src, data)
    end
end)

RegisterNetEvent('esx_scratchcard:close', function()
    local src = source
    local data = pending[src]
    if not data then return end
    payout(src, data)
    pending[src] = nil
end)

AddEventHandler('playerDropped', function()
    pending[source] = nil
end)
