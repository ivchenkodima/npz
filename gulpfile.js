'use strict';

var gulp = require('gulp'),
    nconf = require('nconf'),
    watch = require('gulp-watch'),
    prefixer = require('gulp-autoprefixer'),
    sequence = require('gulp-sequence'),
    uglify = require('gulp-uglify'),
    sass = require('gulp-sass'),
    sourcemaps = require('gulp-sourcemaps'),
    rigger = require('gulp-rigger'),
    cssmin = require('gulp-minify-css'),
    imagemin = require('gulp-imagemin'),
    pngquant = require('imagemin-pngquant'),
    rimraf = require('rimraf'),
    browserSync = require("browser-sync"),
    gulpIf = require('gulp-if'),
    reload = browserSync.reload,
    replace = require('gulp-replace'),
    ngAnnotate = require('gulp-ng-annotate'),
    ghPages = require('gulp-gh-pages'),
    gulpPrefix = require('gulp-prefix'),
    gitUrlParse = require('git-url-parse'),

    s18n = require('s18n'),
    rename = require('gulp-rename'),
// Multilanguage
    l10n = require('gulp-l10n');


var packageJSON = require('./package.json');

//translate
var l10nOpts = {
    elements: [],
    native: 'ua',
    base: 'ua',
    enforce: 'strict'
};
var LANGUAGE_DEFAULT = 'ru';

nconf.argv().env();

var params = {
    production: ('' + nconf.get('production')) == 'true'
};

var path = {
    build: { //Тут мы укажем куда складывать готовые после сборки файлы
        html: "build/",
        template: "build/template/",
        js: 'build/js/',
        css: 'build/css/',
        img: 'build/img/',
        fonts: 'build/fonts/'
    },
    src: { //Пути откуда брать исходники
        template: 'src/template/**/*.html', //Синтаксис src/*.html говорит gulp что мы хотим взять все файлы с расширением .html
        html: "src/index.html",
        js: 'src/js/main.js',//В стилях и скриптах нам понадобятся только main файлы
        style: 'src/style/style.sass',
        img: 'src/img/**/*.*', //Синтаксис img/**/*.* означает - взять все файлы всех расширений из папки и из вложенных каталогов
        fonts: 'src/fonts/**/*.*'
    },
    watch: { //Тут мы укажем, за изменением каких файлов мы хотим наблюдать
        template: 'src/template/*/*.html',
        html: "src/index.html",
        js: 'src/js/main.js',
        style: 'src/style/**/*.sass',
        img: 'src/img/**/*.*',
        fonts: 'src/fonts/**/*.*'
    },
    clean: './build'
};
var config = {
    server: {
        baseDir: "./build"
    },
    tunnel: true,
    host: 'localhost',
    port: 9000,
    logPrefix: "Frontend_Devil"
};

gulp.task('html:build', function () {
    return gulp.src(path.src.html) //Выберем файлы по нужному пути
        .pipe(rigger()) //Прогоним через rigger
        .pipe(gulp.dest(path.build.html)) //Выплюнем их в папку build
        .pipe(reload({stream: true})); //И перезагрузим наш сервер для обновлений
});
gulp.task('template:build', function () {
    return gulp.src(path.src.template) //Выберем файлы по нужному пути
        // .pipe(rigger()) //Прогоним через rigger
        .pipe(gulp.dest(path.build.template)) //Выплюнем их в папку build
        .pipe(reload({stream: true})); //И перезагрузим наш сервер для обновлений
});
gulp.task('js:build', function () {
    return gulp.src(path.src.js) //Найдем наш main файл
        .pipe(rigger()) //Прогоним через rigger
        .pipe(sourcemaps.init()) //Инициализируем sourcemap
        .pipe(ngAnnotate())
        .pipe(uglify()) //Сожмем наш js
        .pipe(sourcemaps.write()) //Пропишем карты
        .pipe(gulp.dest(path.build.js)) //Выплюнем готовый файл в build
        .pipe(reload({stream: true})); //И перезагрузим сервер
});
gulp.task('style:build', function () {
    return gulp.src(path.src.style) //Выберем наш main.scss
        .pipe(sourcemaps.init()) //То же самое что и с js
        .pipe(sass()) //Скомпилируем
        .pipe(prefixer()) //Добавим вендорные префиксы
        .pipe(cssmin()) //Сожмем
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(path.build.css)) //И в build
        .pipe(reload({stream: true}));
});
gulp.task('image:build', function () {
    return gulp.src(path.src.img) //Выберем наши картинки
        .pipe(gulpIf(params.production, imagemin({ //Сожмем их
            progressive: true,
            svgoPlugins: [{removeViewBox: false}],
            use: [pngquant()],
            interlaced: true
        })))
        .pipe(gulp.dest(path.build.img)) //И бросим в build
        .pipe(reload({stream: true}));
});

gulp.task('fonts:build', function () {
    return gulp.src(path.src.fonts)
        .pipe(gulp.dest(path.build.fonts))
});
gulp.task('build', [
    'html:build',
    'template:build',
    'js:build',
    'style:build',
    'fonts:build',
    'image:build'
]);

gulp.task('watch', function () {
    //gulp.watch(path.watch.html, ['html:build']);
    //gulp.watch(path.watch.html, ['template:build']);
    gulp.watch(path.watch.style, ['style:build']);
    gulp.watch(path.watch.js, ['js:build']);
    gulp.watch(path.watch.img, ['image:build']);
    gulp.watch(path.watch.fonts, ['fonts:build']);
    gulp.watch(['src/langs/**/*', path.watch.html], ['localize']);
});
gulp.task('webserver', function () {
    browserSync(config);
});
gulp.task('clean', function (cb) {
    rimraf(path.clean, cb);
});

gulp.task('build-www', function (cb) {
    sequence('clean', ['build', 'localize'], cb)
});
gulp.task('default', function (cb) {
    sequence('build-www', ['webserver', 'watch'], cb)
});

gulp.task('extract-locales', ['html:build', 'template:build'], function () {
    return gulp.src(['www/**/*.html'])
        .pipe(l10n.extract({
            elements: l10nOpts.elements,
            native: l10nOpts.native
        }))
        .pipe(gulp.dest('src/langs'));
});

gulp.task('load-locales', function () {
    return gulp.src(['src/langs/*.json'])
        .pipe(l10n.setLocales({
            native: l10nOpts.native,
            enforce: l10nOpts.enforce
        }));
});

gulp.task('localize', ['html:build', 'template:build', 'load-locales'], function () {
    return gulp.src(['build/*.html', 'build/template/**/*.html'], {base: 'build/'})
        .pipe(l10n())
        .pipe(replace(/s18n[\w\-]*((=)?([\"\'][^\'^\"]*[\"\'])?)?/g, ''))
        .pipe(gulpIf('build/' + l10nOpts.base + '/**/**.*', rename(function (path) {
            path.dirname = path.dirname.replace(l10nOpts.base + '/', '').replace(l10nOpts.base, '');
        })))
        .pipe(gulp.dest('build'))
});

// Deploy

gulp.task('deploy-prefix', ['build-www'], function () {
    var prefix = gitUrlParse(packageJSON.repository || '').name;
    if (prefix) {
        prefix = '/' + prefix + '/';
    }

    return gulp.src(['build/**/*'])
        .pipe(gulpPrefix(prefix, [
            {match: "a[href]", attr: "href"}, // this selector was added to the default set of selectors
            {match: "script[src]", attr: "src"},
            {match: "link[href]", attr: "href"},
            {match: "img[src]", attr: "src"},
            {match: "input[src]", attr: "src"},
            {match: "img[data-ng-src]", attr: "data-ng-src"}
        ]))
        .pipe(gulp.dest('build'))
});
gulp.task('deploy', ['deploy-prefix'], function () {
    return gulp.src(['build/**/*'])
        .pipe(ghPages())
});
//gulp.task('localize-build', ['load-locales'], localize);

