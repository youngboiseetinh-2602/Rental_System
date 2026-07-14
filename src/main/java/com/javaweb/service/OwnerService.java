package com.javaweb.service;

import com.javaweb.model.response.Rental;
import java.util.List;

public interface OwnerService {

    List<Rental> getOwnerRentals(Long ownerId);
}
