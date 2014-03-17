var fs = require( 'fs' )
        , util = require( 'util' )
        , http = require( 'http' )
        , express = require( 'express' )
        , app = express();

app.set( 'port', process.argv[2] );
app.use( express.logger( 'dev' ) );
app.use( express.json() );
app.use( express.urlencoded() );
app.use( express.bodyParser() );
app.use( express.methodOverride() );
app.use( app.router );

app.post( '/', function ( req, res )
{
    var game = JSON.parse( req.body.data );
    var moves = getMoves( game.state, game.player );
    res.send( moves );
    res.end();
} );
app.get( '/', function ( req, res )
{
    res.send( 'hello' );
    res.end();
} );

var server = http.createServer( app ).listen( app.get( 'port' ), function ()
{
    console.log( 'Express server listening on port ' + app.get( 'port' ) );
} );

process.stdin.on( 'data', function ( data )
{
    var game = JSON.parse( data );
    moves = getMoves( game.state, game.player );
    console.log( JSON.stringify( moves ) );
} );

function getMoves( state, player )
{
    var energy;
    var spawn;
    var enemyenergy;
    var enemySpawn;
    var playerIndices;
    var enemyIndices;
    var moves = [];
    var collisionIndex = {};  // to:from;

    if( player === 'r' )
    {
        energy = state.p1.energy;
        spawn = state.p1.spawn;
        enemyenergy = state.p2.energy;
        enemySpawn = state.p2.spawn;
        playerIndices = getAllIndices( state.grid, 'r' );
        enemyIndices = getAllIndices( state.grid, 'b' );
    }
    else
    {
        energy = state.p2.energy;
        spawn = state.p2.spawn;
        enemyenergy = state.p1.energy;
        enemySpawn = state.p1.spawn;
        playerIndices = getAllIndices( state.grid, 'b' );
        enemyIndices = getAllIndices( state.grid, 'r' );
    }

    for( var j = 0; playerIndices.length > j; j++ )
    {
        var index = playerIndices[ j ];
        collisionIndex[ index ] = index;
    }

    playerIndices.forEach(
            function ( playerIndex )
            {

                var adjacent = getAdjacentIndices( state, playerIndex );
                var destination = getTo( state, energy, spawn, enemyenergy, enemySpawn, playerIndices, enemyIndices, playerIndex, adjacent )
                if( !collisionIndex[ destination ] )  // space is NOT already occupied by moving bot or bot unable to move
                {
                    collisionIndex[ destination ] = playerIndex;  // report that you are moving to a destination is free of friendly bots,
                    delete collisionIndex[ playerIndex ];  // report that you you are occupying your current position so you don't get run over
                    moves.push( {from: playerIndex, to: destination} );  // move
                }
            } );

    return moves;
}

function getTo( state, energy, spawn, enemyenergy, enemySpawn, playerIndices, enemyIndices, playerIndex, adjacent )
{
    var to = playerIndex;
    var botCoords = indexToCoord( state, playerIndex );
    var aDistancesToAllEnergy = getDistances( botCoords );
    //console.log( "bot" + playerIndex + "\naDistancesToAllEngery: " + aDistancesToAllEnergy )
    var minIndex = indexOfMin( aDistancesToAllEnergy );
    var nearestEnergy = getAllIndices( state.grid, '*' )[minIndex ];
    // console.log( "bot" + playerIndex + " nearest energy is: " + minIndex + " " + indexToCoord( state, nearestEnergy ) );
    if( nearestEnergy )
    {
        var energyCoords = indexToCoord( state, nearestEnergy );
        if( energyCoords.y > botCoords.y + 1 )
        {
            console.log( "bot" + playerIndex + " moving up" );
            return to = coordToIndex( state, { x: botCoords.x, y: botCoords.y + 1} );
        }
        if( energyCoords.y < botCoords.y - 1 )
        {
            console.log( "bot" + playerIndex + " moving down" );
            return to = coordToIndex( state, { x: botCoords.x, y: botCoords.y - 1} );
        }
        if( energyCoords.x > botCoords.x + 1 )
        {
            console.log( "bot" + playerIndex + " moving right" );
            return to = coordToIndex( state, { x: botCoords.x + 1, y: botCoords.y} );
        }
        if( energyCoords.x < botCoords.x - 1 )
        {
            console.log( "bot" + playerIndex + " moving left" );
            return to = coordToIndex( state, { x: botCoords.x - 1, y: botCoords.y} );
        }

        // just in case we're diagonal... get closer!
        if( energyCoords.y > botCoords.y )
        {
            console.log( "bot" + playerIndex + " moving up" );
            return to = coordToIndex( state, { x: botCoords.x, y: botCoords.y + 1} );
        }
        if( energyCoords.y < botCoords.y )
        {
            console.log( "bot" + playerIndex + " moving down" );
            return to = coordToIndex( state, { x: botCoords.x, y: botCoords.y - 1} );
        }
        if( energyCoords.x > botCoords.x )
        {
            console.log( "bot" + playerIndex + " moving right" );
            return to = coordToIndex( state, { x: botCoords.x + 1, y: botCoords.y} );
        }
        if( energyCoords.x < botCoords.x )
        {
            console.log( "bot" + playerIndex + " moving left" );
            return to = coordToIndex( state, { x: botCoords.x - 1, y: botCoords.y} );
        }
    }
    console.log( "bot" + playerIndex + " moving random" );
    return to;

    function getDistances( botCoords )
    {
        var aDistances = [];
        var aAllEnergy = getAllCoords( state, '*' );
        for( var i = 0; aAllEnergy.length > i; i++ )
        {
            var energyCoords = aAllEnergy[ i ];
            var distance = getDistance( botCoords, energyCoords );
            aDistances.push( distance );
        }
        return aDistances;

        function getDistance( a, b )
        {
            return ( Math.abs( b.x - a.x ) + Math.abs( b.y - a.y ) );
        }
    }
}

function indexOfMin( aArray )
{
    var iMinIndex = 0;
    for( var i = 0; aArray.length > i; i++ )
    {
        var item = Math.abs( aArray[ i ] );
        if( item < aArray[ 0 ] )
        {
            iMinIndex = i;
        }
    }
    return iMinIndex;
}

function indexToCoord( state, index )
{
    var x = index % state.cols;
    var y = ~~(index / state.cols);
    return {x: x, y: y};
}

function coordToIndex( state, coord )
{
    return state.cols * coord.y + coord.x;
}

function getAllCoords( oState, search )
{
    var aIndices = getAllIndices( oState.grid, search );
    var aCoords = [];
    for( var i = 0; aIndices.length > i; i++ )
    {
        var index = aIndices[ i ];
        aCoords.push( indexToCoord( oState, index ) );
    }
    return aCoords;
}
function getAllIndices( grid, search )
{
    var arr = [];
    if( search === '.' ) search = '\\.';
    if( search === '*' ) search = '\\*';
    var re = new RegExp( search, 'g' );
    while( m = re.exec( grid ) )
    {
        arr.push( m.index );
    }
    return arr;
}

function getAdjacentIndices( state, index )
{
    var indices = [];
    var coord = indexToCoord( state, index );
    if( coord.x > 0 )
        indices.push( coordToIndex( state, {x: coord.x - 1, y: coord.y} ) );
    if( coord.x < state.cols - 1 )
        indices.push( coordToIndex( state, {x: coord.x + 1, y: coord.y} ) );
    if( coord.y > 0 )
        indices.push( coordToIndex( state, {x: coord.x, y: coord.y - 1} ) );
    if( coord.y < state.rows - 1 )
        indices.push( coordToIndex( state, {x: coord.x, y: coord.y + 1} ) );

    return indices;
}
