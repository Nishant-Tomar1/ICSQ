// import React from 'react';
// import Highcharts from 'highcharts';
// import HighchartsReact from 'highcharts-react-official';

// const WebChart = ({ detailedScores }) => {
//   const categories = Object.keys(detailedScores);
//   const scores = Object.values(detailedScores);

//   const options = {
//     chart: {
//       polar: true,
//       type: 'line',       // Keep 'line' here; series will be 'area'
//       backgroundColor: '#f8f9fa',
//       height: 400
//     },
//     title: {
//       text: 'Detailed Scores Overview',
//       align: 'center',
//       style: {
//         fontSize: '18px',
//         fontWeight: 'bold'
//       }
//     },
//     pane: {
//       size: '80%'
//     },
//     xAxis: {
//       categories: categories,
//       tickmarkPlacement: 'on',
//       lineWidth: 0,
//       labels: {
//         style: {
//           fontSize: '13px',
//           fontWeight: '600'
//         }
//       }
//     },
//     yAxis: {
//       gridLineInterpolation: 'polygon',
//       lineWidth: 1,
//       min: 0,
//       max: 100,
//       tickInterval: 20,
//       labels: {
//         style: {
//           fontSize: '11px'
//         }
//       }
//     },
//     tooltip: {
//       shared: true,
//       pointFormat: '<span style="color:{series.color}">{series.name}: <b>{point.y}</b><br/>'
//     },
//     series: [{
//       name: 'Score',
//       data: scores,
//       pointPlacement: 'on',
//       type: 'area',          // Important for the filled spiderweb polygon
//       fillOpacity: 0.25,
//       marker: {
//         enabled: true,
//         radius: 4
//       },
//       lineWidth: 2,
//       color: '#007bff'
//     }],
//     credits: {
//       enabled: false
//     }
//   };

//   return (
//     <div className="p-4">
//       <HighchartsReact highcharts={Highcharts} options={options} />
//     </div>
//   );
// };

// export default WebChart;
