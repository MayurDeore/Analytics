﻿angular.module("umbraco").controller("Analytics.PageViewsController",
    function ($scope, $location, statsResource, settingsResource, dateRangeService, assetsService) {

        var profileID = "";

        // items list array
        $scope.items = [];
        $scope.itemSources = [];

        // change sort icons
        function iconSorting(tableId, field) {
            $('#' + tableId + ' th i').each(function () {
                $(this).removeClass().addClass('fa fa-sort'); //icon-sort  // reset sort icon for columns with existing icons
            });
            if ($scope.descending)
                $('#' + tableId + ' #' + field + ' i').removeClass().addClass('fa fa-sort-down'); //icon-caret-down
            else
                $('#' + tableId + ' #' + field + ' i').removeClass().addClass('fa fa-sort-up'); //icon-caret-up
        }

        $scope.dateFilter = settingsResource.getDateFilter();

        //$scope.$on('DateFilterChanged', function (event, x) {
        //    console.log("catch change");
        //    $scope.dateFilter = x;
        //});
        
        $scope.$watch('dateFilter', function () {
            
            settingsResource.setDateFilter($scope.dateFilter.startDate, $scope.dateFilter.endDate);
            //Get Profile
            settingsResource.getprofile().then(function (response) {
                $scope.profile = response.data;
                profileID = response.data.Id;

                if (profileID == null || profileID == "") {
                    $location.path("/analytics/analyticsTree/edit/settings");
                    return;
                }
                
                //Get chart data for monthly visit chart
                statsResource.getvisitcharts(profileID, $scope.dateFilter.startDate, $scope.dateFilter.endDate).then(function (response) {
                    var chartData = response.data;

                    //Create Line Chart
                    var ctx = document.getElementById("viewMonths").getContext("2d");
                    var viewMonthsChart = new Chart(ctx).Line(chartData);
                });

                //Get Browser via statsResource - does WebAPI GET call
                statsResource.getvisits(profileID, $scope.dateFilter.startDate, $scope.dateFilter.endDate).then(function (response) {
                    $scope.views = response.data;
                    $scope.loadingViews = false;

                    // clear existing items
                    $scope.items.length = 0;
                    // push objects to items array
                    angular.forEach($scope.views.Rows, function (item) {
                        $scope.items.push({
                            pagepath: item.Cells[0],
                            visits: parseInt(item.Cells[1]),
                            pageviews: parseInt(item.Cells[2])
                        });
                    });

                    $scope.sort = function (newSortField) {
                        if ($scope.sortField == newSortField)
                            $scope.descending = !$scope.descending;

                        // sort by new field and change sort icons
                        $scope.sortField = newSortField;
                        iconSorting("tbl-views", newSortField);
                    };

                    var defaultSort = "pageviews"; // default sorting
                    $scope.sortField = defaultSort;
                    $scope.descending = true; // most pageviews first

                    // change sort icons
                    iconSorting("tbl-views", defaultSort);
                });

                //Get Browser specific via statsResource - does WebAPI GET call
                statsResource.getsources(profileID, $scope.dateFilter.startDate, $scope.dateFilter.endDate).then(function (response) {
                    $scope.sources = response.data;

                    // clear existing items
                    $scope.itemSources.length = 0;
                    // push objects to items array
                    angular.forEach($scope.sources.Rows, function (item) {
                        $scope.itemSources.push({
                            s_source: item.Cells[0],
                            s_visits: parseInt(item.Cells[1]),
                            s_pageviews: parseInt(item.Cells[2])
                        });
                    });

                    $scope.sort = function (newSortField) {
                        if ($scope.sortField == newSortField)
                            $scope.descending = !$scope.descending;

                        // sort by new field and change sort icons
                        $scope.sortField = newSortField;
                        iconSorting("tbl-sources", newSortField);
                    };

                    var defaultSort = "s_pageviews"; // default sorting
                    $scope.sortField = defaultSort;
                    $scope.descending = true; // most pageviews first

                    // change sort icons
                    iconSorting("tbl-sources", defaultSort);
                });

            });
        });

        //load the seperat css for the editor to avoid it blocking our js loading
        assetsService.loadCss("/umbraco/assets/css/umbraco.css");
        assetsService.loadCss("/App_Plugins/Analytics/backOffice/AnalyticsTree/icons/css/font-awesome.css");
    });