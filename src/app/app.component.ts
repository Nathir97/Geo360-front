import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.addustomerTask.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  allTasks: any[] = [];
  view: any;

  newTask = {
    title: '',
    description: '',
    status: 'Pending',
    lat: 0,
    lng: 0
  };

  stats = {
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0
  };

  loadArcGISScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if ((window as any).require) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://js.arcgis.com/4.29/';
      script.onload = () => resolve();
      script.onerror = () => reject('ArcGIS script failed to load.');
      document.head.appendChild(script);
    });
  }

  async ngOnInit() {
    try {
      await this.loadArcGISScript();
      this.loadMap();
    } catch (error) {
      console.error(error);
    }
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
      'esri/Map',
      'esri/views/MapView',
      'esri/Graphic'
    ], (Map: any, MapView: any, Graphic: any) => {
      const map = new Map({
        basemap: 'streets-navigation-vector'
      });

      this.view = new MapView({
        container: 'viewDiv',
        map: map,
        center: [80.6, 7.3],
        zoom: 7
      });

      fetch('https://geo-task360-api.althafahamed075.repl.co/tasks')
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
        type: 'point',
        longitude: task.lng,
        latitude: task.lat
      };

      const symbol = {
        type: 'simple-marker',
        color: task.status === 'Completed' ? 'green' :
               task.status === 'In Progress' ? 'orange' : 'red',
        size: 10
      };

      const graphic = new Graphic({
        geometry: point,
        symbol: symbol,
        attributes: task,
        popupTemplate: {
          title: '{title}',
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
    arcgis(['esri/Graphic'], (Graphic: any) => {
      let tasksToShow = this.allTasks;

      if (status !== 'All') {
        tasksToShow = this.allTasks.filter(t => t.status === status);
      }

      this.updateStats(tasksToShow);
      this.addGraphics(tasksToShow, Graphic);
    });
  }

  addCustomerTask(): void {
    fetch('https://geo-task360-api.althafahamed075.repl.co/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(this.newTask)
    })
      .then(res => res.json())
      .then(data => {
        alert('Task added successfully!');
        this.allTasks.push({ ...this.newTask });
        this.updateStats(this.allTasks);
        this.addGraphics(this.allTasks, (window as any).require('esri/Graphic'));
        this.newTask = { title: '', description: '', status: 'Pending', lat: 0, lng: 0 };
      })
      .catch(err => {
        console.error('Failed to add task:', err);
        alert('Failed to add task');
      });
  }
}
