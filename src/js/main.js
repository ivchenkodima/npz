"use strict";

var myApp = angular.module('myApp', ['ui.router']);

myApp.config(function($stateProvider, $urlRouterProvider) {
    $stateProvider
        .state('main', {
            url: "/main",
            templateUrl: "template/main.html"
        })
        .state('company', {
            url: "/company",
            templateUrl: "template/pages/company.html"
        })
        .state('about', {
            url: "/about",
            templateUrl: "template/pages/1/about.html"
        })
        .state('history', {
            url: "/history",
            templateUrl: "template/pages/1/history.html"
        })
        .state('mission', {
            url: "/mission",
            templateUrl: "template/pages/1/mission.html"
        })
        .state('life', {
            url: "/life",
            templateUrl: "template/pages/2/life.html"
        })
        .state('aegon', {
            url: "/aegon",
            templateUrl: "template/pages/2/aegon.html"
        })
        .state('career', {
            url: "/career",
            templateUrl: "template/pages/career.html"
        })
        .state('contacts', {
            url: "/contacts",
            templateUrl: "template/pages/contacts.html"
        });


    $urlRouterProvider.otherwise("/main")
});