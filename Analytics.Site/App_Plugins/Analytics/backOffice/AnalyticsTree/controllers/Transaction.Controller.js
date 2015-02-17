﻿angular.module("umbraco").controller("Analytics.TransactionController",
    function ($scope, $location, statsResource, settingsResource) {

        var profileID = "";

        // items list array
        $scope.itemTransactions = [];

        // change sort icons
        function iconSorting(tableId, field) {
            $('#' + tableId + ' th i').each(function () {
                $(this).removeClass().addClass('icon'); // reset sort icon for columns with existing icons
            });
            if ($scope.descending)
                $('#' + tableId + ' #' + field + ' i').removeClass().addClass('icon-navigation-down');
            else
                $('#' + tableId + ' #' + field + ' i').removeClass().addClass('icon-navigation-up');
        }

        $scope.dateFilter = settingsResource.getDateFilter();
        $scope.loadingViews = true;
        $scope.$watch('dateFilter', function () {
            $scope.loadingViews = true;
            settingsResource.setDateFilter($scope.dateFilter.startDate, $scope.dateFilter.endDate);
            //Get Profile
            settingsResource.getprofile().then(function (response) {
                $scope.profile = response.data;
                profileID = response.data.Id;
                $scope.currencyCode = $scope.profile.Currency;

                if (profileID == null || profileID == "") {
                    $location.path("/analytics/analyticsTree/edit/settings");
                    return;
                }
                $scope.loadingViews = false;

                //Get chart data for monthly visit chart
                statsResource.gettransactionscharts(profileID, $scope.dateFilter.startDate, $scope.dateFilter.endDate).then(function (response) {
                    var chartData = response.data;

                    var canvasId = "viewTransactions";
                    var canvas = document.getElementById(canvasId),
                        canvasWidth = canvas.clientWidth,
                        canvasHeight = canvas.clientHeight;

                    // Replace the chart canvas element
                    $('#' + canvasId).replaceWith('<canvas id="' + canvasId + '" width="' + canvasWidth + '" height="' + canvasHeight + '"></canvas>');

                    var options = {
                        labelTemplate: "<ul class=\"<%=name.toLowerCase()%>-legend\">"
                            + "<% for (var i=0; i<datasets.length; i++){%>"
                            + "<li><span style=\"background-color:<%=datasets[i].fillColor%>;border-color:<%=datasets[i].strokeColor%>\"></span>"
                            + "<%if(datasets[i].label){%><%=datasets[i].label%><%}%></li><%}%>"
                            + "</ul>",
                        bezierCurve: false,
                        scaleBeginAtZero: true
                    };

                    // Draw the chart / Create Line Chart
                    var ctx = $('#' + canvasId).get(0).getContext("2d");
                    var viewTransactionsChart = new Chart(ctx).Line(chartData, options);

                    // Create legend
                    var legendHolder = document.createElement('div');
                    legendHolder.className = "chart-legend-holder";
                    legendHolder.innerHTML = viewTransactionsChart.generateLegend();

                    var helpers = Chart.helpers;
                    helpers.each(legendHolder.firstChild.childNodes, function (legendNode, index) {

                        if (index == 0) {
                            var t = document.createTextNode("Transactions");
                            legendNode.appendChild(t);
                            legendNode.className = "first";
                        }
                    });

                    // ensure legend not gets added multiple times
                    $(".chart-legend-holder").remove();
                    viewTransactionsChart.chart.canvas.parentNode.appendChild(legendHolder);
                });

                //Get Browser specific via statsResource - does WebAPI GET call
                statsResource.gettransactions(profileID, $scope.dateFilter.startDate, $scope.dateFilter.endDate).then(function (response) {
                    $scope.transactions = response.data.ApiResult;

                    // clear existing items
                    $scope.itemTransactions.length = 0;
                    // push objects to items array
                    angular.forEach($scope.transactions.Rows, function (item) {
                        $scope.itemTransactions.push({
                            transactionId: item.Cells[0],
                            quantity: parseInt(item.Cells[1]),
                            revenue: parseFloat(item.Cells[2])
                        });
                    });

                    $scope.sort = function (newSortField) {
                        if ($scope.sortField == newSortField)
                            $scope.descending = !$scope.descending;

                        // sort by new field and change sort icons
                        $scope.sortField = newSortField;
                        iconSorting("tbl-transactions", newSortField);
                    };

                    var defaultSort = "transactionId"; // default sorting
                    $scope.sortField = defaultSort;
                    $scope.descending = true; // most pageviews first

                    // change sort icons
                    iconSorting("tbl-transactions", defaultSort);
                });

            });
        });
    });