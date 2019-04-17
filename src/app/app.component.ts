import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormControl, Validators } from '@angular/forms';
import { distinctUntilChanged, map, catchError } from 'rxjs/operators';

import { filter, find } from 'lodash';
import { BehaviorSubject, Observable } from 'rxjs';

const SEARCH_MATCH_KEYS = ['ifsc', 'bank_id', 'branch', 'city', 'address', 'district', 'state', 'bank_name'];

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit{

  public readonly cities = ['MUMBAI', 'AMRITSAR', 'JALANDHAR', 'LUDHIANA', 'CHANDIGARH'];

  public searchControl = new FormControl('');
  public cityControl = new FormControl('', [Validators.required]);

  public filteredData$$ = new BehaviorSubject([]);
  public filteredData$ = this.filteredData$$.asObservable();

  public rawData = null;

  public loading: boolean = false;

  constructor(
    public http: HttpClient,
  ) {
    this.searchControl.valueChanges.pipe(distinctUntilChanged()).subscribe(() => {
      this.filterData();
    });

    this.cityControl.valueChanges.pipe(distinctUntilChanged()).subscribe(() => {
      this.getData().subscribe((data) => {
        this.loading = false;
        this.rawData = data;
        this.filterData();
      });
    });
  }

  public ngOnInit() {
    this.cityControl.setValue(this.cities[0]);
    this.filterData();
  }

  private getData(): Observable<any> {
    this.loading = true;
    const city = this.cityControl.value;
    const url = `//vast-shore-74260.herokuapp.com/banks?city=${city}`;
    return this.http.get(url).pipe(
      map((data) => data),
      catchError((_error) => {
        console.log('error', _error);
        return _error;
      })
    )
  }


  private filterData() {
    const searchTerm = this.searchControl.value.trim().toLowerCase();
    let filteredData: dataItem[] = this.rawData;

    if (searchTerm.length !== 0) {
      filteredData = filter(filteredData, (item) => {
        let matched = false;
        find(SEARCH_MATCH_KEYS, (k) => {
          const val = item[k];
          return (matched =
            (val && val.toString().toLowerCase().indexOf(searchTerm) > -1) || matched);
        });
        return matched;
      });
    }
    this.filteredData$$.next(filteredData);
  }

}

interface dataItem {
  ifsc: string,
  bank_id: number,
  branch: string,
  address: string,
  city: string,
  district: string,
  state: string,
  bank_name: string

}
