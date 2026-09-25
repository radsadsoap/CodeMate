export const LANGUAGES = [
    {
        id: 'python',
        label: 'Python',
        runtime: 'CPython 3.14',
        compiler: 'cpython-3.14.0',
        load: () => import('@codemirror/lang-python').then((module) => module.python()),
    },
    {
        id: 'javascript',
        label: 'JavaScript',
        runtime: 'Node.js 20',
        compiler: 'nodejs-20.17.0',
        load: () => import('@codemirror/lang-javascript').then((module) => module.javascript()),
    },
    {
        id: 'java',
        label: 'Java',
        runtime: 'OpenJDK 22',
        compiler: 'openjdk-jdk-22+36',
        load: () => import('@codemirror/lang-java').then((module) => module.java()),
    },
    {
        id: 'cpp',
        label: 'C++',
        runtime: 'GCC 13.2',
        compiler: 'gcc-13.2.0',
        load: () => import('@codemirror/lang-cpp').then((module) => module.cpp()),
    },
];

export const languageById = Object.fromEntries(LANGUAGES.map((language) => [language.id, language]));
