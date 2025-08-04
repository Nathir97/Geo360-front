import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,   // <-- Add this if you are using standalone components, otherwise remove
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  allTasks: any[] = [];
  view: any;

  stats = {
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0
  };

  ngOnInit(): void {
    this.loadMap();
  }

  updateStats(tasks: any[]): void {
    this.stats.total = tasks.length;
    this.stats.pending = tasks.filter(t => t.status === 'Pending').length;
    this.stats.inProgress = tasks.filter(t => t.status === 'In Progress').length;
    this.stats.completed = tasks.filter(t => t.status === 'Completed').length;
  }

  loadMap(): void {
    const arcgis = (window as any).require;
    arcgis([
      "esri/Map",
      "esri/views/MapView",
      "esri/Graphic"
    ], (Map: any, MapView: any, Graphic: any) => {
      const map = new Map({
        basemap: "streets-navigation-vector"
      });

      this.view = new MapView({
        container: "viewDiv",
        map: map,
        center: [80.6, 7.3], // Sri Lanka
        zoom: 7
      });

      // IMPORTANT: Replace this URL with your actual backend API endpoint that returns JSON tasks
      fetch("https://geo-task360-api.althafahamed075.repl.co/tasks")  
        .then(response => response.json())
        .then(tasks => {
          this.allTasks = tasks;
          this.updateStats(tasks);
          this.addGraphics(tasks, Graphic);
        })
        .catch(err => {
          console.error('Failed to fetch tasks:', err);
        });
    });
  }

  addGraphics(tasks: any[], Graphic: any): void {
    this.view.graphics.removeAll();

    tasks.forEach(task => {
      const point = {
        type: "point",
        longitude: task.lng,
        latitude: task.lat
      };

      const symbol = {
        type: "simple-marker",
        color: task.status === "Completed" ? "green" :
               task.status === "In Progress" ? "orange" : "red",
        size: 10
      };

      const graphic = new Graphic({
        geometry: point,
        symbol: symbol,
        attributes: task,
        popupTemplate: {
          title: "{title}",
          content: `
            <b>Description:</b> {description}<br>
            <b>Status:</b> {status}
          `
        }
      });

      this.view.graphics.add(graphic);
    });
  }

  filterStatus(status: string): void {
    const arcgis = (window as any).require;
    arcgis(["esri/Graphic"], (Graphic: any) => {
      let tasksToShow = this.allTasks;

      if (status !== "All") {
        tasksToShow = this.allTasks.filter(t => t.status === status);
      }

      this.updateStats(tasksToShow);
      this.addGraphics(tasksToShow, Graphic);
    });
  }
}
