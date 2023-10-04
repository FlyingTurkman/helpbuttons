import produce from "immer";
import { GlobalState, store } from "pages";
import { FetchUserData } from "./Users";
import { UpdateEvent, WatchEvent } from "store/Event";
import { UserService } from "services/Users";
import { catchError, map } from "rxjs";
import { handleError } from "./helper";

export class UserFollow implements WatchEvent {
    public constructor(private userId: string, private onSuccess, private onError) {}
    
    public watch(state: GlobalState) {
      return UserService.follow(this.userId).pipe(map((data) => {store.emit(new FetchUserData(this.onSuccess, this.onError))}),
      catchError((error) => handleError(this.onError, error))
      )
    }
  }
  
  export class UserUnfollow implements WatchEvent {
    public constructor(private userId: string, private onSuccess, private onError) {}

    public watch(state: GlobalState) {
      return UserService.unfollow(this.userId).pipe(map((data) => {store.emit(new FetchUserData(this.onSuccess, this.onError))}),
      catchError((error) => handleError(this.onError, error))
      )
    }
  }