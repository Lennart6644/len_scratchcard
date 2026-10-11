Locale = {}

local function current()
    return Locales[Config.Locale] or Locales.en
end

function Locale.notify(key, ...)
    local text = current().notify[key] or key
    if select('#', ...) > 0 then
        return string.format(text, ...)
    end
    return text
end

function Locale.ui()
    return current().ui
end
