/** @type {import('intl-gen').Options} */
const config = {
    ext: 'json',
    filename: 'translation',
    directory: ['locales'],
    languages: ['en', 'de', 'es', 'fr', 'id', 'ja'],
    baseLanguage: 'en',
    ignoreExists: true,
    enableSubdirectory: true,
    placeholder: '@'
}

export default config