Ext.define('Niks.Apps.StoryDepth', {
    extend: 'Rally.app.App',
    componentCls: 'app',

    items: [
        {
            xtype: 'container',
            itemId: 'option_box',
            layout: 'hbox'
        }
    ],

    html: '',

    _getData: function(query) {
        var totals = Ext.create('Deft.Deferred');
        this._loadRecordCount('hierarchicalrequirement', Rally.data.wsapi.Filter.fromQueryString('('+query+' >0)'), 'ans').then({
            success: function(result) {
                    totals.resolve(result);
            },
            failure: function(result) {
                console.log('Failed: ', result);
                totals.reject(result);
            }
        });
                return totals.promise;
    },

    _recurse: function(query) {
        var me = this;
        this._getData(query).then({
            success: function(results) {
                if (results.ans !==0) {
                    me.add( {
                        xtype: 'container',
                        html: 'Level: ' + query.match(/Parent/g).length + ' Count: ' + results.ans
                    });

                    me._recurse('Parent.'+query);
                }
            },
            failure: function(result) {
                console.log('Failed to get data: ', result)
            },
            scope: me
        });
    },

    launch: function() {
        var qStr = 'Parent.PortfolioItem.ObjectID';
        this._recurse(qStr);
    },

    _loadRecordCount: function(model, filters, id){
        var deferred = Ext.create('Deft.Deferred');
        console.log("Starting load: model>>",model, 'filters>>', filters.toString());

        Ext.create('Rally.data.wsapi.Store', {
            model: model,
            filters: filters,
            limit: 1,
            pageSize: 1
        }).load({
            callback : function(records, operation, successful) {
                var result = {};
                if (successful){
                    console.log('result:', operation);
                    result[id] = operation.resultSet.totalRecords || 0;
                    deferred.resolve(result);
                } else {
                    console.log("Failed: ", operation);
                    result[id] = 0;
                    deferred.resolve(result);
                    //deferred.reject("Couldn't Load: " + operation.error.errors.join('. '));
                }
            }
        });
        return deferred.promise;
    }
});
