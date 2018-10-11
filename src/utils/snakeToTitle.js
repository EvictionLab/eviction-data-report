import Vue from 'vue';

Vue.filter('snakeToTitle', function (str) {  
    return str.split('-').map(function (item) {
        return item.charAt(0).toUpperCase() + item.substring(1);
    }).join(' ');
});
