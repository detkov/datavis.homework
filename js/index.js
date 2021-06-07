const width = 1000;
const barWidth = 500;
const height = 500;
const margin = 30;

const yearLable = d3.select('#year');
const countryName = d3.select('#country-name');

const barChart = d3.select('#bar-chart')
    .attr('width', barWidth)
    .attr('height', height);

const scatterPlot = d3.select('#scatter-plot')
    .attr('width', width)
    .attr('height', height);

const lineChart = d3.select('#line-chart')
    .attr('width', width)
    .attr('height', height);

let xParam = 'fertility-rate';
let yParam = 'child-mortality';
let rParam = 'gdp';
let year = '2000';
let param = 'child-mortality';
let lineParam = 'gdp';
let highlighted = '';
let selectedCountry;
let selectedRegion;

let minYear = 1800;
let maxYear = 2020;

const x = d3.scaleLinear().range([margin * 2, width - margin]);
const y = d3.scaleLinear().range([height - margin, margin]);

const xBar = d3.scaleBand().range([margin * 2, barWidth - margin]).padding(0.1);
const yBar = d3.scaleLinear().range([height - margin, margin])

const xAxis = scatterPlot.append('g').attr('transform', `translate(0, ${height - margin})`);
const yAxis = scatterPlot.append('g').attr('transform', `translate(${margin * 2}, 0)`);

const xLineAxis = lineChart.append('g').attr('transform', `translate(0, ${height - margin})`);
const yLineAxis = lineChart.append('g').attr('transform', `translate(${margin * 2}, 0)`);

const xBarAxis = barChart.append('g').attr('transform', `translate(0, ${height - margin})`);
const yBarAxis = barChart.append('g').attr('transform', `translate(${margin * 2}, 0)`);

const colorScale = d3.scaleOrdinal().range(['#DD4949', '#39CDA1', '#FD710C', '#A14BE5']);
const radiusScale = d3.scaleSqrt().range([10, 30]);

loadData().then(data => {

    colorScale.domain(d3.set(data.map(d => d.region)).values());

    d3.select('#range').on('input', function () {
        year = d3.select(this).property('value');
        yearLable.html(year);
        updateScatterPlot();
        updateBar();
    });

    d3.select('#radius').on('change', function () {
        rParam = d3.select(this).property('value');
        updateScatterPlot();
        updateBar();
    });

    d3.select('#x').on('change', function () {
        xParam = d3.select(this).property('value');
        updateScatterPlot();
        updateBar();
    });

    d3.select('#y').on('change', function () {
        yParam = d3.select(this).property('value');
        updateScatterPlot();
        updateBar();
    });

    d3.select('#param').on('change', function () {
        param = d3.select(this).property('value');
        updateBar();
    });

    d3.select('#p').on('change', function () {
        lineParam = d3.select(this).property('value');
        updateLinearPlot();
    });

    function updateBar() {
        regions = d3.map(data, d => d['region']).keys();

        mean = regions.map(
            baseRegion => (
                d3.mean(
                    data.filter(d => d['region'] == baseRegion)
                        .flatMap(d => d[param][year])
                )
            )
        );

        mean_for_region = [];
        regions.forEach((key, i) => {
            mean_for_region.push({
                'region': key,
                'mean': mean[i]
            });
        });

        xBar.domain(regions);
        xBarAxis.call(d3.axisBottom(xBar));

        yBar.domain([0, d3.max(mean)]).range([height, 0]);
        yBarAxis.call(d3.axisLeft(yBar));

        barChart.selectAll('rect').data(mean_for_region)
            .enter()
            .append('rect');

        barChart.selectAll('rect').data(mean_for_region)
            .attr('width', xBar.bandwidth())
            .attr('height', d => height - yBar(d['mean']))
            .attr('x', d => xBar(d['region']))
            .attr('y', d => yBar(d['mean']) - 30)
            .style('fill', d => colorScale(d['region']));

        barChart.selectAll('rect').on('click', function (selectedRect) {
            if (selectedRegion != selectedRect['region']) {
                selectedRegion = selectedRect['region']

                d3.selectAll('rect').style('opacity', 0.6);
                d3.selectAll('circle').style('opacity', 0);

                d3.selectAll('rect').filter(d => d['region'] == selectedRegion).style('opacity', 1);
                d3.selectAll('circle').filter(d => d['region'] == selectedRegion).style('opacity', 0.75);
            } else {
                d3.selectAll('rect').style('opacity', 1);
                d3.selectAll('circle').style('opacity', 0.75);
                selectedRegion = null;
            }
        });

        if (selectedRegion != null) {
            d3.selectAll('circle').style('opacity', 0);
            d3.selectAll('circle').filter(d => d['region'] == selectedRegion).style('opacity', 0.75);
        }

        return;
    }

    function updateLinearPlot() {
        if (selectedCountry) {

            d3.select('.country-name').text(selectedCountry);

            let country_data = data.filter(d => d['country'] == selectedCountry).map(d => d[lineParam])[0];

            let dict_data = [];
            for (let i = minYear; i < maxYear; i++)
                dict_data.push({
                    'year': i,
                    'value': parseFloat(country_data[i])
                })

            x.domain([minYear, maxYear]);
            xLineAxis.call(d3.axisBottom(x));

            let yRange = d3.values(dict_data).map(d => Number(d['value']));
            y.domain([d3.min(yRange), d3.max(yRange) * 1.05]);
            yLineAxis.call(d3.axisLeft(y));

            lineChart.append('path').attr('class', 'line').datum(dict_data)
                .enter()
                .append('path');

            lineChart.selectAll('.line')
                .datum(dict_data)
                .attr('fill', 'none')
                .attr('stroke', '#1f77b4')
                .attr('stroke-width', 2)
                .attr('d', d3.line()
                    .x(d => x(d['year']))
                    .y(d => y(d['value']))
                );
        }

        return;
    }

    function updateScatterPlot() {
        d3.select('.year').text(year);

        let xRange = data.map(d => Number(d[xParam][year]));
        x.domain([d3.min(xRange), d3.max(xRange) * 1.05]);
        xAxis.call(d3.axisBottom(x));

        let yRange = data.map(d => Number(d[yParam][year]));
        y.domain([d3.min(yRange), d3.max(yRange) * 1.05]);
        yAxis.call(d3.axisLeft(y));

        let rRange = data.map(d => Number(d[rParam][year]));
        radiusScale.domain([d3.min(rRange), d3.max(rRange)]);

        scatterPlot.selectAll('circle').data(data)
            .enter()
            .append('circle');

        scatterPlot.selectAll('circle').data(data)
            .attr('cx', d => x(d[xParam][year]))
            .attr('cy', d => y(d[yParam][year]))
            .attr('r', d => radiusScale(d[rParam][year]))
            .style('fill', d => colorScale(d['region']))
            .style('opacity', 0.75);

        scatterPlot.selectAll('circle').on('click', function (selectedCircle) {
            selectedCountry = selectedCircle['country'];
            d3.selectAll('circle').style('stroke-width', 1);
            d3.selectAll('circle').filter(d => d['country'] == selectedCountry).style('stroke-width', 3);

            updateLinearPlot();
        });


        return;
    }

    updateBar();
    updateScatterPlot();
    updateLinearPlot()
});


async function loadData() {
    const data = {
        'population': await d3.csv('data/population.csv'),
        'gdp': await d3.csv('data/gdp.csv'),
        'child-mortality': await d3.csv('data/cmu5.csv'),
        'life-expectancy': await d3.csv('data/life_expectancy.csv'),
        'fertility-rate': await d3.csv('data/fertility-rate.csv')
    };

    return data.population.map(d => {
        const index = data.gdp.findIndex(item => item.geo == d.geo);
        return {
            country: d.country,
            geo: d.geo,
            region: d.region,
            population: d,
            'gdp': data['gdp'][index],
            'child-mortality': data['child-mortality'][index],
            'life-expectancy': data['life-expectancy'][index],
            'fertility-rate': data['fertility-rate'][index]
        }
    })
}