fx_version 'cerulean'
game 'gta5'
lua54 'yes'

name 'esx_scratchcard'
description 'ESX Scratchcards - realistic scratch experience with multi-language support'
author 'Lennart'
version '3.0.0'

dependencies {
    'es_extended'
}

shared_scripts {
    'config.lua',
    'locales/*.lua'
}

client_scripts {
    'client/main.lua'
}

server_scripts {
    'server/main.lua'
}

ui_page 'html/index.html'

files {
    'html/index.html',
    'html/style.css',
    'html/script.js'
}
