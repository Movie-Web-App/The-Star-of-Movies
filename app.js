'use strict';

$('.login-form').hide();
$('#login-button').css('background-color', '#222222');

$('#login-button').on('click', () => {
    console.log('Hi from app.js');
    $('.signup-form').hide();
    $('.login-form').show();
    $('#signup-button').css('background-color', '#222222');
    $('#login-button').css('background-color', 'rgb(31, 146, 36)');

            });

$('#signup-button').on('click', () => {
    console.log('Hi from app.js signup');
    $('.signup-form').show();
    $('.login-form').hide();
    $('#login-button').css('background-color', '#222222');
    $('#signup-button').css('background-color', 'rgb(31, 146, 36)');
            });