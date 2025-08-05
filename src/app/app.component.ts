import { Component, OnInit } from '@angular/core';
import { createClient } from '@supabase/supabase-js';

declare var require: any;
declare var define: any;

const supabaseUrl = 'https://YOUR_SUPABASE_URL.supabase.co';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  customer = {
    customer_id: '',
    customer_name: '',
    lng: null,
    lat: null,
    status: 'Pending'
  };

  customers: any[] = [];
  currentStatus: string = 'All';

  ngOnInit(): void {
    this.loadCustomers();
    this.loadMap();
  }

  async addCustomer() {
    const { data, error } = await supabase
      .from('customers')
      .insert([this.customer]);

    if (error) {
      console.error('Insert error:', error.message);
      return;
    }

    console.log('Customer added:', data);
    this.customer = {
      customer_id: '',
      customer_name: '',
      lng: null,
      lat: null,
      status: 'Pending'
    };
    this.loadCustomers();
  }

  async loadCustomers() {
    let query = supabase.from('customers').select('*');

    if (this.currentStatus !== 'All') {
      query = query.eq('status', this.currentStatus);
    }

    const { data, error } = await query;

    if (!error) {
      this.customers = data;
      this.plotCustomersOnMap();
    }
  }

  filterStatus(status: string) {
    this.currentStatus = status;
    this.loadCustomers();
  }

  loadMap() {
    const script = document.createElement('script');
    script.src = 'https://js.arcgis.com/4.29/';
    script.onload = () => {
      require(["esri/Map", "esri/views/MapView"], (Map: any, MapView: any) => {
        const map = new Map({
          basemap: "streets-navigation-vector"
        });

        const view = new MapView({
          container: "mapDiv",
          map: map,
          center: [80.7, 7.8],
          zoom: 6
        });

        // Save the view globally to use later for plotting
        (window as any).mapView = view;
      });
    };
    document.head.appendChild(script);
  }

  plotCustomersOnMap() {
    require(["esri/Graphic"], (Graphic: any) => {
      const view = (window as any).mapView;
      if (!view) return;

      view.graphics.removeAll();

      this.customers.forEach(customer => {
        const point = {
          type: "point",
          longitude: customer.lng,
          latitude: customer.lat
        };

        const marker = new Graphic({
          geometry: point,
          symbol: {
            type: "simple-marker",
            color: customer.status === 'Completed' ? "green" :
                   customer.status === 'In Progress' ? "orange" : "red",
            size: "10px"
          },
          attributes: {
            name: customer.customer_name
          }
        });

        view.graphics.add(marker);
      });
    });
  }
}
